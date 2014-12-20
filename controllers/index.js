var models = require("../models")
var path = require('path')

exports.getcompanysets = function(req,res){
    models.CompanySet.findAll({limit:10,order:'createdAt DESC'}).success(function(sets){
	res.success(sets);
    });
}

exports.viewset = function(req,res){
    var id = req.params.setid;
    models.CompanySet.find(id).success(function(set){
	if(!set){
	    res.error("set not found",404);
	    return;
	}
	var lis = JSON.parse(set.companylist);
	models.Company.findAll({
	    where:{companyid:lis},
	    attributes:['companyid','name','ticker','marketcap','updatedAt']
	}).success(function(list){
	    res.success(list);
	});
    });
}

exports.compare = function(req,res){
    var curId = req.query.curId,
    selectedId = req.query.selectedId,
    selset,
    curset;
    
    console.log(curId);
    console.log(selectedId);
    
    var diff = function(){
	if(!selset||!curset)
	    return;
	var selectedList = JSON.parse(selset.companylist).sort(function(a,b){return a-b;}),
	curList = JSON.parse(curset.companylist).sort(function(a,b){return a-b;}),
	i=0,j=0,diffset={},guard = 6000000000;
	
	selectedList.push(guard);
	curList.push(guard);
	
	while(i<selectedList.length && j<curList.length){
	    var delta = (+curList[j])-(+selectedList[i]);
	    if(delta==0){
		console.log(curList[j]);
		i++,j++;
	    }
	    else if(delta>0){
		diffset[+selectedList[i]]={
		    flag:-1,
		    id:+selectedList[i]
		};
		i++;
	    }else{
		diffset[+curList[j]]={
		    flag:1,
		    id:+curList[j]
		};
		j++;
	    }
	}
	models.Company.findAll({
	    where:{
		companyid:Object.keys(diffset)
	    },
	    attributes:['companyid','name','ticker','exchange','marketcap']
	}).then(function(list){
	    list.forEach(function(li){
		li.dataValues.flag = diffset[li.companyid].flag;
	    });
	    res.success(list);
	},function(e){
	    res.error(e);
	});
    }
    
    if(curId && selectedId){
	models.CompanySet.findOne(curId).then(function(cur){
	    curset = cur;
	    diff();
	});
	models.CompanySet.findOne(selectedId).then(function(selected){
	    selset=selected;
	    diff();
	});
    }else{
	res.error("please select set first.");
    }
}


exports.tpl = function(req,res){
    models.Template.findAll({
	where:{
	    saved:true
	}
    }).success(function(templates){
	templates.forEach(function(tpl){
	    tpl.dataValues.content = JSON.parse(tpl.dataValues.content);
	});
	res.success(templates);
    });
}

exports.addtpl = function(req,res){
    models.Template.create(req.body).success(function(instance){
	if(instance){
	    res.success(instance);
	}
    });
}

exports.index = function(req,res){
    res.render('index');
}

exports.company = function(req,res){
    models.Company.find({
	//order:[[models.Stock,models.Quote,'updatedAt','DESC']],
	where:{companyid:req.params.companyid},
	include:[{
	    model:models.Stock,
	    include:[{
		model:models.Quote,
	    }]
	},{
	    model:models.Person,
	    as:'Employees',
	    attributes:['name','personid','updatedAt']
	},{
	    model:models.Person,
	    as:'BoardMembers',
	    attributes:['name','personid','updatedAt']
	},{
	    model:models.UploadedFile,
	    attributes:['name','real','updatedAt']
	}]
    }).success(function(cmp){
	res.success(cmp);
    });
}

exports.upfile = function(req,res){
    var file = req.files && req.files.upfile;
    
    if(file){
	res.success({name:file.name,real:path.basename(file.path)});
    }else{
	res.error('no file',400);
    }
    delete req.files;
}

exports.addfile = function(req,res){
    var f = req.body;
    models.UploadedFile.create(f).spread(function(fileinfo,created){
	if(created){
	    res.success();
	}else{
	    res.error("errors occured",500);
	}
    });
}

exports.person = function(req,res){
    models.Person.find({
	where:{personid:req.params.personid},
	include:[{
	    model:models.Company,
	    as:'Companies'
	},{
	    model:models.Company,
	    as:'Boards'
	}]
    }).success(function(person){
	res.success(person);
    });
}

function buildquery(ids,tpl){
    var query = 'SELECT * FROM CompanyPeople INNER JOIN Companies\
ON Companies.`companyid`=CompanyPeople.companycompanyid\
INNER JOIN Stocks\
ON Stocks.`companyid`=Companies.`companyid`\
INNER JOIN Quotes\
ON Quotes.`stockcode`=Stocks.`stockcode`\
WHERE PersonPersonid IN (\
SELECT PersonPersonid FROM CompanyPeople WHERE CompanyCompanyid IN ('+ids+')\
AND degree >= '+tpl.fraudCompany+'\
)\
AND Companies.reputable = '+tpl.reputableCompany+' AND Companies.`marketcap`> '+tpl.marketCapitalization+' AND Stocks.`shortsellable`>='+tpl.shortSellable+' AND Quotes.`volume`>0 AND Stocks.`listed`=1 AND Stocks.`exchange` in ('+tpl.exchange.join()+')';
    return query;
}

exports.compute = function(req,res){
    models.CompanySet.findOne(2).then(function(set){
	var strIds = JSON.parse(set.companylist).join();
	var sql = buildquery(strIds);
	models.sequelize.query(sql).then(function(d){
	    res.success(d);
	});
    },function(e){
	res.error(e.message,500);
    });
}