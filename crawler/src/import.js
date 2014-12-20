var models = require("../../models")
var fs = require("fs")

var importer = function(){
    this.dataDir = "../data/";
    this.seedPersonFile = "test_seed_person_info.json";
    this.seedCompanyFile = "seed_csr1.json";
    
    this.progress = 1;
}

importer.prototype.init = function(){
    this.seedPerson = JSON.parse(fs.readFileSync(this.dataDir+this.seedPersonFile).toString());
    this.seedCompany = JSON.parse(fs.readFileSync(this.dataDir+this.seedCompanyFile).toString());
}

importer.prototype.start = function(){
    this.init();
    this.createPerson();
    this.createCompany();
}

importer.prototype.computeDegree = function(title){
    var checkExists = function(kw){
	return title.indexOf(kw)>-1;
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

importer.prototype.createCompanyPerson = function(){
    Object.keys(this.seedPerson).forEach(function(k){
	var p = this.seedPerson[k];
	var c = this.seedCompany[p.company_id];
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
    },this);
}

//setB must be the subset of setA
importer.prototype.subtract = function(setA,setB){
    var addSet = [];
    var i=0,j=0;
    setB.push(50000000000);
    while(j<setB.length && i<setA.length){
	if(setA[i]<setB[j]){
	    addSet.push(setA[i]);
	}else{
	    j++;
	}
	i++;
    }
    return addSet;
}

importer.prototype.createStock = function(){
    var companyids = Object.keys(this.seedCompany);
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
	    var c = that.seedCompany[id];
	    var islist = c.exchange_ticker!='-',ex,tk,code;
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
	    case 'aim':
	    case 'amex':
	    case 'db':
	    case 'enxtam':
	    case 'otcbb':
	    case 'otcpk':
		return null;
		break;
	    case 'sehk':
		while(tk.length<4){
		    tk = '0'+tk;
		}
		code = tk+'.HK';
		break;
	    case 'sgx':
	    case 'tse':
		return null;
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
	    }
	    return {
		stockcode:code,
		exchange:ex,
		ticker:tk,
		companyid:id
	    }
	}).filter(function(r){
	    return !!r;
	});
	
	models.Stock.bulkCreate(records).then(function(a){
	    console.log("create stock success, %d",a.length);
	},function(e){
	    console.log(e);
	});
    });
}

importer.prototype.createCompany = function(){
    var companyids = Object.keys(this.seedCompany);
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
	    var c = that.seedCompany[id];
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
		desc:c.bussiness_descriptioh,
		marketcap:c["market capitalization"],
		name:c.company_name,
		listed:islist,
		ticker:tk,
		exchange:ex,
		fraud:true
	    };
	});
	models.Company.bulkCreate(records).then(function(a){
	    console.log("create record success, %d",a.length);
	    that.progress = that.progress | 1;
	    that.onComplete();
	},function(e){
	    console.log(e);
	});
    });
}

importer.prototype.createPerson = function(){
    var personids = Object.keys(this.seedPerson);
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
	var records = addSet.map(function(id){
	    var p = that.seedPerson[id];
	    return {
		personid:p.person_id,
		name:p.person_name,
		age:p.person_age,
		email:p.email_address,
		majors:p.majors,
		education:p.colleges_universities,
		yearborn:p.year_born,
		desc:p.background,
		source:1//1. means this person tracked from a fraud company.
	    }
	});
	models.Person.bulkCreate(records).then(function(a){
	    console.log("insert record success, %d",a.length);
	    that.progress = that.progress | (1<<1);
	    that.onComplete();
	},function(e){
	    console.log(e);
	});
    });
}

importer.prototype.onComplete = function(){
    if(this.progress&1 && this.progress&(1<<1)){
	this.createStock();
	this.createCompanyPerson();
    }
}

var that = new importer();
that.start();