var models = require("../models")
var path = require('path')
var emitter = require('events').EventEmitter;

var ctrEmitter = new emitter();

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
    console.log(typeof req.body);
    
    models.UploadedFile.create(f).then(function(fileinfo){
	if(fileinfo && fileinfo.id){
	    res.success(fileinfo);
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
    var query = 'SELECT Companies.companyid,CompanyPeople.PersonPersonid AS personid,People.name AS personname,CompanyPeople.degree,Companies.name AS companyname,Companies.fraud,Companies.reputable,Stocks.shortsellable,CompanyPeople.title \
FROM CompanyPeople INNER JOIN Companies \
ON Companies.`companyid`=CompanyPeople.companycompanyid \
INNER JOIN People ON People.`personid`=CompanyPeople.personpersonid \
LEFT OUTER JOIN Stocks \
ON Stocks.`companyid`=Companies.`companyid` \
LEFT OUTER JOIN (SELECT Quotes.`stockcode`,volume,marketcap FROM Quotes \
INNER JOIN (SELECT Quotes.`stockcode`,MAX(updatedAt) AS lastupdate FROM Quotes GROUP BY Quotes.`stockcode`) AS q \
ON Quotes.stockcode=q.stockcode AND Quotes.updatedAt = q.lastupdate) AS qq \
ON qq.`stockcode`=Stocks.`stockcode` \
WHERE PersonPersonid IN ( \
SELECT PersonPersonid FROM CompanyPeople WHERE CompanyCompanyid IN ('+ids+') \
AND degree >= '+tpl.fraudCompany+' \
) \
' +(tpl.reputableCompany?'AND Companies.reputable=0':'')+' AND qq.`marketcap`> '+tpl.marketCapitalization+' AND Stocks.`shortsellable`>='+tpl.shortSellable+/*' AND qq.`volume`>'+tpl.dailyTradingVolume+*/' AND Companies.`listed`=1 AND Stocks.`exchange` in ("'+tpl.exchanges.join("\",\"")+'") AND CompanyPeople.degree>='+tpl.affiliations;
    return query;
}

function buildquery2(ids,tpl){
    var query = 'SELECT Companies.companyid,CompanyPeople.PersonPersonid AS personid,People.name AS personname,CompanyPeople.degree,Companies.name AS companyname,Companies.fraud,Companies.reputable,Stocks.shortsellable,CompanyPeople.title,Companies.marketcap AS marketcap,qq.volume,Stocks.`exchange` \
FROM CompanyPeople INNER JOIN Companies \
ON Companies.`companyid`=CompanyPeople.companycompanyid \
INNER JOIN People ON People.`personid`=CompanyPeople.personpersonid \
LEFT OUTER JOIN Stocks \
ON Stocks.`companyid`=Companies.`companyid` \
LEFT OUTER JOIN (SELECT Quotes.`stockcode`,volume,marketcap FROM Quotes \
INNER JOIN (SELECT Quotes.`stockcode`,MAX(updatedAt) AS lastupdate FROM Quotes GROUP BY Quotes.`stockcode`) AS q \
ON Quotes.stockcode=q.stockcode AND Quotes.updatedAt = q.lastupdate) AS qq \
ON qq.`stockcode`=Stocks.`stockcode` \
WHERE PersonPersonid IN ( \
SELECT PersonPersonid FROM CompanyPeople WHERE CompanyCompanyid IN ('+ids+') \
AND degree >= '+tpl.fraudCompany+' \
) \
'
    return query;//INNER JOIN ('+ids+') AS fraud ON fraud. \
}

var loadResult = function(id){
    return models.Result.findOne({where:{resultid:id},include:[{
	model:models.Template,
	attributes:["id","tplname","content","saved"]
    },{
	model:models.CompanySet,
	attributes:["setid","companycount"]
    }]});
}

exports.exportresult = function(req,res){
    if(!req.params.resultid){
	res.error("result id should not be empty",400);
	return;
    }
    loadResult(req.params.resultid).then(function(r){
	var cnt = JSON.parse(r.content).map(function(record){
	    return Object.keys(record).map(function(k){
		return record[k];
	    }).join("\t");
	}).join("\r\n");
	res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(cnt)
	});
	res.end(cnt);
    },function(e){
	console.log(e);
	res.error(e,500);
    });
}

exports.viewResult = function(req,res){
    if(!req.params.resultid){
	res.error("result id should not be empty",400);
	return;
    }
    //console.log(aggregate(result));
    loadResult(req.params.resultid).then(function(r){
	r.dataValues.content = aggregate(JSON.parse(r.content));
	res.success(r);
    },function(e){
	console.log(e);
	res.error(e,500);
    });
}
var logtpl = function(req,res){
    var tpl=req.body.tpl,setid=req.body.setid;
    console.log(tpl);
    if(tpl.id){
	ctrEmitter.emit("TplSaved",req,res);
	return;
    }
    tpl.content = JSON.stringify(tpl.content);
    models.Template.create(tpl).then(function(instance){
	instance.dataValues.content = JSON.parse(instance.content);
	req.body.tpl = instance;
	ctrEmitter.emit("TplSaved",req,res);
    },function(e){
	console.log(e);
	res.error(e);
    });
}
var filterFromDb =function(req,res){
    var tpl=req.body.tpl,setid=req.body.setid;
    if(!tpl || !setid){
	console.log("server error.");
	throw "tpl or setid is empty";
    }
    var exchanges =[];
    tpl.content.exchange.forEach(function(ex){
	switch(ex){
	case 'US':
	    exchanges.push('NasdaqCM','NasdaqGM','NasdaqGS','NYSE');
	case 'HK':
	    exchanges.push('SEHK');
	case 'China':
	    exchanges.push('SHSE','SZSE');
	case 'Other':
	    exchanges.push('AIM','AMEX','DB','ENXTAM','OTCBB','OTCPK','SGX','TSE','TSX');
	    break;
	default:
	    break;
	}
    });
    tpl.content.exchanges = exchanges;
    
    models.CompanySet.findOne(setid).then(function(set){
	var strIds = JSON.parse(set.companylist).join();
	var sql = buildquery2(strIds,tpl.content);
	
	models.sequelize.query(sql).then(function(records){
	    var result = records.filter(function(item){
		if(item.fraud)
		    return true;
		if(tpl.content.reputableCompany==1 && item.reputable==1){
		    return false;
		}
		return item.degree>=tpl.content.affiliations&&item.shortsellable>=tpl.content.shortSellable&&item.marketcap>tpl.content.marketCapitalization&&tpl.content.exchanges.some(function(ex){return item.exchange==ex;});
	    });
	    console.log("%d, %d",records.length,result.length);
	    models.Result.create({
		content:JSON.stringify(result),
		setid:setid,
		tplid:tpl.id
	    }).then(function(r){
		ctrEmitter.emit("Computed",req,res,r.resultid);
	    },function(e){
		res.error(e);
		//ctrEmitter.emit("error",e,req,res);
	    });
	});
    },function(e){
	console.log(e);
	res.error(e);
	//ctrEmitter.emit("error",e,req,res);
    });
}
var aggregate = function(items){
    var hash = items.reduce(function(pre,cur){
	if(pre[cur.personid]){
	    if(cur.fraud){
		pre[cur.personid].fraud.push(cur);
	    }else{
		pre[cur.personid].aff.push(cur);
	    }
	}else{
	    if(cur.fraud){
		pre[cur.personid]={fraud:[cur],aff:[]};
	    }else{
		pre[cur.personid]={fraud:[],aff:[cur]};
	    }
	    pre[cur.personid].personname = cur.personname;
	}
	delete cur.personid;
	delete cur.personname;
	return pre;
    },{});
    
    return Object.keys(hash).filter(function(k){
	return hash[k].fraud.length+hash[k].aff.length>1;
    }).map(function(k){
	hash[k].personid=k;
	return hash[k];
    });
}

var computed = function(req,res,resultid){
    res.success(resultid);
}

var onerror = function(e,req,res){
    res.error(e);
}

ctrEmitter.on("TplSaved",filterFromDb);
ctrEmitter.on("LogTpl",logtpl);
ctrEmitter.on("Computed",computed);
ctrEmitter.on('error',onerror);

exports.compute = function(req,res){
    var tpl = req.body.tpl,
    setid = req.body.setid;
    
    if(! tpl|| !setid){
	res.error("data empty",400);
	return;
    }
    ctrEmitter.emit("LogTpl",req,res);
}
