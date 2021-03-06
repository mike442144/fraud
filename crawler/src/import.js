var models = require("../../models")
var fs = require("fs")
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var importer = function(){
    this.dataDir = "../data/";
    this.seedPersonFile = "seed_psr1.json";
    this.seedCompanyFile = "seed_csr1.json";
    this.relatedDir = "related/";
    this.relationDir = "relation/";
    this.relatedCompanyFiles = [];
    this.relatedPersonFiles = [];
    this.progress = 1;
    this.ep = new require("eventproxy")();
    this.companies = {};
    this.people = {};
    this.seedPerson={};
    this.seedCompany={};
    this.relatedPersonList=[];
    this.relatedCompanyList = {};
}

var merge2Objects =function(targetObj,curObj){
    Object.keys(curObj).reduce(function(pre,cur){
	pre[cur] = curObj[cur];
	return pre;
    },targetObj);
    return targetObj;
}

importer.prototype.init = function(){
    if(fs.existsSync(this.dataDir+this.seedPersonFile)){
	this.seedPerson = JSON.parse(fs.readFileSync(this.dataDir+this.seedPersonFile).toString());
    }
    if(fs.existsSync(this.dataDir+this.seedCompanyFile)){
	this.seedCompany = JSON.parse(fs.readFileSync(this.dataDir+this.seedCompanyFile).toString());
    }
    
    merge2Objects(this.companies,this.seedCompany);
    merge2Objects(this.people,this.seedPerson);
    fs.readdirSync(this.dataDir+this.relatedDir).forEach(function(filename){
	if(filename.indexOf("csr")>-1){
	    this.relatedCompanyFiles.push(filename);
	}else if(filename.indexOf("psr")>-1){
 	    this.relatedPersonFiles.push(filename);
	}
    },this);
    this.relations = [];
    if(fs.existsSync(this.dataDir+this.relationDir)){
	fs.readdirSync(this.dataDir+this.relationDir).forEach(function(filename){
	    var companyid = filename.replace(/\.json/,'');
	    var r = JSON.parse(fs.readFileSync(this.dataDir+this.relationDir+filename).toString());
	    
	    Object.keys(r.auditor).forEach(function(a){
		this.relations.push({
		    companyid:companyid,
		    providerid:r.auditor[a].company_id,
		    providername:r.auditor[a].company_name,
		    type:"auditor"
		});
	    },this);
	    
	    Object.keys(r.advisor).forEach(function(a){
		this.relations.push({
		    companyid:companyid,
		    providerid:r.advisor[a].company_id,
		    providername:r.advisor[a].company_name,
		    type:r.advisor[a].specialty
		});
	    },this);
	},this);
    }
}

importer.prototype.createRelatedCompanyPerson = function(){
    this.relatedPersonFiles.forEach(function(filename){
	JSON.parse(fs.readFileSync(this.dataDir+this.relatedDir+filename).toString()).forEach(function(cur){
	    var record = {
		title:cur.professional_titles,
		degree:that.computeDegree(cur.professional_titles),
		Person:{personid:cur.person_id},
		Company:{companyid:cur.company_id}
	    };
	    models.CompanyPerson.findOrCreate({where:{
		PersonPersonid:record.Person.personid,
		CompanyCompanyid:record.Company.companyid
	    },defaults:record});
	},this);
    },this);
}

importer.prototype.start = function(){
    this.init();
    this.ep.all("companyDone","personDone",function(){
	//return;
	//that.createRelation();
	that.createCompanyPerson(that.seedPerson);// link one person to one or more companies
	
	for(var i = 0; i<that.relatedPersonList.length; i++){
	    that.createCompanyPerson(that.relatedPersonList[i]);
	}
    });
    
    emitter.on("companyDone",function(){// do related while seed done
	if(that.relatedCompanyFiles.length>0){
	    var fname = that.relatedCompanyFiles.shift();
	    var csr = JSON.parse(fs.readFileSync(that.dataDir+that.relatedDir+fname).toString());
	    //that.relatedCompanyList.push(csr);
	    merge2Objects(that.companies,csr);
	    that.createCompany(csr);
	}else{
	    that.ep.emit("companyDone");
	    that.createStock(that.companies);
	}
    });
    
    emitter.on("personDone",function(){// do related while seed done
	if(that.relatedPersonFiles.length>0){
	    var fname = that.relatedPersonFiles.shift();
	    var psr = JSON.parse(fs.readFileSync(that.dataDir+that.relatedDir+fname).toString());
	    that.relatedPersonList.push(psr);
	    //merge2Objects(that.people,p);
	    that.createPerson(psr);
	}else{
	    that.ep.emit("personDone");
	}
    });
    
    this.createPerson(this.seedPerson);
    this.createCompany(this.seedCompany,true);
}

importer.prototype.computeDegree = function(title){
    title = title.toLowerCase();
    var titles = title.split(/(?:,|and)/);
    var reg = /\bnon\b(?:-\w+)?/i;
    titles = titles.filter(function(tit){
	return !reg.test(tit);
    });
    
    var checkExists = function(kw){
	return titles.some(function(title){
	    return title.indexOf(kw.toLowerCase())>-1;
	});
    }
    
    var tight = ['Chief', 'President', 'General Manager', 'Chairman', 'Executive Director', 'Finance', 'Financial', 'Accountant', 'Accounting', 'Investment'],
    medium = ['Audit', 'Secretary' ],
    result;
    
    if(tight.some(checkExists)){
	result=3;
    }else if(medium.some(checkExists)){
	result=2;
    }else{
	result=1;
    }
    
    return result;
}

importer.prototype.createRelation = function(){
    this.relations.forEach(function(relation){
	models.CompanyRelationship.findOrCreate({where:{
	    companyid:relation.companyid,
	    providerid:relation.providerid
	},defaults:relation}).then(function(instances){
	    console.log("create company relation success! %d",instances.length);
	},function(e){
	    console.error(e);
	});
    });
}

importer.prototype.createCompanyPerson = function(people){
    Object.keys(people).forEach(function(k){
	var professionals = people[k];// a professional list of person
	for(var i = 0; i<professionals.length;i++){
	    var p = professionals[i];
	    var dgr = this.computeDegree(p.professional_titles);
	    
	    var record = {
		title:p.professional_titles,
		degree:dgr,
		Person:{personid:p.person_id},
		Company:{companyid:p.company_id}
	    }
	    
	    models.CompanyPerson.findOrCreate({
		where:{
		    PersonPersonid:record.Person.personid,
		    CompanyCompanyid:record.Company.companyid
		},
		defaults:record
	    }).then(function(a){
		console.log("create companyperson success, %d",a.length);
	    });
	}		
    },this);
}

//return result which ele in setB but not SetA
//setB must be the subset of setA
importer.prototype.subtract = function(setA,setB){
    var addSet = [];
    var i=0,j=0;
    setB.push(50000000000);
    setA.push(50000000000);
    while(j<setB.length && i<setA.length){
	if(setA[i]<setB[j]){
	    addSet.push(setA[i]);
	    i++;
	}else if(setA[i]>setB[j]){
	    j++;
	}else{
	    i++;j++;
	}
    }
    return addSet;
}

importer.prototype.createStock = function(companyObj){
    var companyids = Object.keys(companyObj);
    companyids.sort(function(a,b){
	return a-b;
    });
    
    models.Stock.findAll({
	where:{companyid:companyids},
	attributes:['companyid'],
	order:'companyid'
    }).then(function(companies){
	var ids = companies.map(function(company){
	    return company.companyid;
	});
	var addSet = that.subtract(companyids,ids);
	
	var records = addSet.map(function(id){
	    var c = companyObj[id];
	    var islist = c.exchange_ticker!='-',ex,tk,code,shortsellable=1;
	    if(islist){
		var ts = c.exchange_ticker.split(":");
		ex = ts[0];
		tk=ts[1];
	    }else{
		return null;
	    }
	    
	    switch(ex.toLowerCase()){
	    case 'nasdaqcm':
	    case 'nasdaqgm':
	    case 'nasdaqgs':
	    case 'nyse':
	    	code = tk;
	    	break;
	    case 'lse':
		code=tk+'.L';
		break;
	    case 'sehk':
		code = tk;
		while(code.length<4){
		    code = '0'+code;
		}
		code +='.HK';
		shortsellable=0;
		break;
	    case 'shse':
		code = tk+".SS";
		break;
	    case 'szse':
		code = tk+".SZ";
		break;
	    case 'tsx':
		code = tk+".TO";
		break;
	    // case 'aim':
	    // case 'amex':
	    // case 'db':
	    // case 'enxtam':
	    // case 'otcbb':
	    // case 'otcpk':
	    // case 'sgx':
	    // case 'tse':
	    // 	code = tk;
	    // 	break;
	    default:
		code = c.exchange_ticker;
		break;
	    }
	    return {
		stockcode:code,
		exchange:ex,
		ticker:tk,
		companyid:id,
		shortsellable:shortsellable
	    }
	}).filter(function(r){
	    if(r && r.stockcode)
		return true;
	    return false;
	});
	//console.log(records);
	models.Stock.bulkCreate(records).then(function(a){
	    console.log("create stock success, %d",a.length);
	},function(e){
	    console.log(e);
	});
    });
}

importer.prototype.createCompany = function(companyObj,fraud){
    var companyids = Object.keys(companyObj);
    companyids.sort(function(a,b){
	return a-b;
    });
    
    models.Company.findAll({
	where:{companyid:companyids},
	attributes:['companyid'],
	order:'companyid'
    }).then(function(companies){
	var ids = companies.map(function(company){
	    return company.companyid;
	});
	
	var addSet = that.subtract(companyids,ids);
	var records = addSet.map(function(id){
	    var c = companyObj[id];
	    var islist = c.exchange_ticker!='-',ex,tk;
	    if(islist){
		var ts = c.exchange_ticker.split(":");
		ex = ts[0];
		tk=ts[1];
	    }else{
		ex=tk='-';
	    }
	    
	    return {
		companyid:id,
		desc:c.bussiness_description,
		marketcap:c["market capitalization"],
		name:c.company_name,
		listed:islist,
		ticker:tk,
		exchange:ex,
		fraud:!!fraud
	    };
	});
	
	models.Company.bulkCreate(records).then(function(a){
	    console.log("create record success, %d",a.length);
	    that.updateCompany(companyObj,fraud,function(e){
		if(e) console.erro(e);
		emitter.emit("companyDone");
	    });
	    
	    //that.ep.emit("companyDone");
	},function(e){
	    console.log(e);
	});
    });
}

importer.prototype.updateCompany = function(companyObj, fraud, callback){
    var len = Object.keys(companyObj).length;
    var desend = function(){
	if(--len == 0){
	    if(callback)
		callback(null);
	}
    };
    
    Object.keys(companyObj).map(function(key){
	models.Company.update({
	    marketcap:companyObj[key]["market capitalization"]
	},{
	    where:{companyid:key}
	}).then(function(rowNumber){
	    console.log("affected rows: %d", rowNumber);
	    desend();
	}, function(e){
	    desend();
	});
    });
}

importer.prototype.createPerson = function(people){
    var personids = Object.keys(people);
    personids.sort(function(a,b){
	return a-b;
    });
    
    models.Person.findAll({
	where:{personid:personids},
	attributes:['personid'],
	order:"personid"
    }).then(function(persons){
	var ids = persons.map(function(p){
	    return p.personid;
	});
	var addSet = that.subtract(personids,ids);
	// console.log("exists person count: %d",ids.length);
	// console.log("total person count: %d",personids.length);
	// emitter.emit("personDone");
	// return;
	var records = addSet.map(function(id){
	    var p = people[id][0];
	    return {
		personid:p.person_id,
		name:p.person_name,
		age:p.person_age,
		email:p.email_address,
		majors:p.majors,
		education:p.colleges_universities,
		yearborn:p.year_born,
		desc:p.background,
		startyear:p.years_on_board,
		source:1//1. means this person tracked from a fraud company.
	    }
	});
	models.Person.bulkCreate(records).then(function(a){
	    console.log("insert record success, %d",a.length);
	    emitter.emit("personDone");
	},function(e){
	    console.log(e);
	});
    });
}

var that = new importer();
that.start();
