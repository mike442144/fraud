
'use strict';

const fs = require('fs');
const path = require('path');
const models = require("../../models");

const dataDir = "../data/";
const fileName = process.argv[2];

const geoLocations = [
	'\\(Europe \\(Primary\\)\\)',
	'\\(Asia \\/ Pacific \\(Primary\\)\\)',
	'\\(Africa \\/ Middle East \\(Primary\\)\\)',
	'\\(United States and Canada \\(Primary\\)\\)',
	'\\(Latin America and Caribbean \\(Primary\\)\\)'
];

if(!fileName){
	console.error(`Usage: node parseCompanyPeopleFromPsr.js <file> \neg. file: seed_psr1-2018-01-11.json`);
	process.exit(1);
}

const filePath = path.join(dataDir,fileName);

if(!fs.existsSync(filePath)){
	console.error(`file not found: ${filePath}`);
	process.exit(1);
}

function parse(content){
	if(!content || content==='-'){
		return [];
	}
	
	let stack = [], ch, i=-1, curStartIdx = 0, company, status = '', professionals=[];
	if(content.charAt(content.length-1)!==';'){ // uniform the last comma
		content+=';';
	}

	content = geoLocations.reduce((cnt, loc) => cnt.replace(new RegExp(loc,'g'), ''), content);
	
	while(i<content.length){
		ch = content.charAt(++i);

		switch(ch){
		case '(':
			//console.log("(", stack.length, curStartIdx, i);
			if(stack.length===0){ // got company name? or got ticker?
				if(curStartIdx!==i){
					let name = content.slice(curStartIdx, i).trim();
					curStartIdx = i + 1;
					company = {name,title:''};
				}else{
					++curStartIdx;
				}
			}
			
			stack.push(i);
			break;
		case ')':
			//console.log(")", stack.length, curStartIdx, i);
			if(stack.length===1){
				if(status==='ticker'){// ticker
					company.exchange_ticker = content.slice(curStartIdx,i).trim();
					status='';
				}else{// titles
					company.title = content.slice(curStartIdx,i).trim();
				}
				
				curStartIdx = i + 1;
			}
			
			stack.pop();
			break;
		case ';':
			if(!stack.length){ //stack empty, got one company
				if(company && company.exchange_ticker)// only need listed company
					professionals.push(company);
				
				//console.log(company);
				company = null;
				curStartIdx = i+1;
			}
			break;
		case ':':
			if(stack.length===1){// ticker
				status = 'ticker';
			}
			
			break;
		case ' ':
			if(curStartIdx === i){
				++curStartIdx;
			}
		break;	
		default:
			break;
		}
	}
	
	return professionals;
}

let psr = null;
try{
	psr = JSON.parse(fs.readFileSync(filePath).toString());
}catch(e){
	console.error(e);
	process.exit(1);
}

const peopleIdList = Object.keys(psr);
const people = Object.create(null);
const tickers = new Map();
const exchange_tickers = new Set();
//console.log(parse("Australian Technology Group Ltd. (Senior Key Executive (Prior)); Ernst & Young LLP (Other Key Executive (Prior); Technology Professional (Prior)); International Business Machines Corporation (NYSE:IBM) (Other Professional (Prior)); McKinsey & Company, Inc. (Other Professional (Prior)); Technology Venture Partners Pty. Ltd. (Investment Professional; Senior Key Executive; Top Key Executive)"));

for(let personId of peopleIdList){
	for(let cp of psr[personId]){
		let cnt = cp.geographic_locations;//.all_company_affiliations;
		for(let {name, title, exchange_ticker} of parse(cnt)){
			let personId = Number(cp.person_id.match(/(?<=IQ)\d+/)[0])
			, ticker = exchange_ticker.split(":")[1]
			, professional = {
				company_name:name,
				exchange_ticker:exchange_ticker,
				ticker: ticker,
				//company_id:'',//need to read from database
				person_id:personId,
				professional_titles: title //should be parsed
			};
			
			// console.log(personId);
			// tickers.set(exchange_ticker,null);
			exchange_tickers.add(exchange_ticker);
			
			if(personId in people){
				people[personId].push(professional);
				// if(people[personId].length>100)
				// 	console.log(personId);
			}else{
				people[personId] = [professional];
			}
		}
	}
}

console.log(`nTickers: ${tickers.size}`);
// console.log(`${[...exchange_tickers].join()}`);
// console.log( (Object.keys(people).map(personId => people[personId].length)));
const companiesNotInDb = [];
models.Company.findAll({
	// where: {ticker: [...tickers.keys()]},
	attributes:['ticker','companyid','exchange','listed']
}).then(companies => {
	const allCompanies = new Map(companies.map(c => [`${c.exchange}:${c.ticker}`, c]));
	// const total = new Set(companies.map(c=>`${c.exchange}:${c.ticker}`));
	for(const et of exchange_tickers){
		if(!allCompanies.has(et)){
			companiesNotInDb.push(et);
		}
	}
	
	console.log(`nCompanies in database: ${companies.length}`);
	
	Object.keys(people).forEach(personId => {
		for(let pro of people[personId]){
			if(allCompanies.has(pro.exchange_ticker)){
				pro.company_id = allCompanies.get(pro.exchange_ticker).companyid;
			}
		}
	});

	fs.writeFileSync(path.join(dataDir,fileName.replace('seed','related')),JSON.stringify(people));
	fs.writeFileSync(path.join(dataDir,'companiesNotInDb.txt'), companiesNotInDb.join('\r\n'));
	console.log(`nPersons: ${Object.keys(people).length}`);
});
