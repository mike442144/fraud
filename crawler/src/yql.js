var YQL = require('yql');
var models = require("../../models");
var fs = require('fs')

function genQuery(stocks){
    var symbol_array = stocks.map(function(stock){
	return stock.stockcode;
    });
    var str = symbol_array.join('","');
    //fs.appendFileSync("../data/t.txt",str);
    var q = 'select Currency,AverageDailyVolume,symbol,LastTradePriceOnly,Volume,PercentChange,StockExchange,PERatio,PEGRatio,Open,PreviousClose,Ask,Bid,OneyrTargetPrice,DaysRange,YearRange,MarketCapitalization,EPSEstimateCurrentYear,PriceEPSEstimateCurrentYear,DividendYield,Change,LastTradeTime,LastTradeDate from yahoo.finance.quotes where symbol in ("'+str+'")';
    return new YQL(q);
}

models.Stock.findAll({attribute:['stockcode'],limit:200,offset:0}).then(function(stocks){
    genQuery(stocks).exec(function(err, data) {
	if(!data.query.results){
	    console.log("request failed.");
	    return;
	}
	
	var records = data.query.results.quote.map(function(q,i){
	    var mp = q.MarketCapitalization;
	    if(mp){
		if(mp.toLowerCase().indexOf("b")>0){
		    mp = Number(mp.replace(/[bB]/g,''))*1000;
		}else if(mp.toLowerCase().indexOf("m")>0){
		    mp = Number(mp.replace(/[Mm]/g,''));
		}else if(mp.toLowerCase().indexOf("k")>0){
		    mp = Number(mp.replace(/[kK]/g,''))/1000;
		}
	    }
	    //fs.appendFileSync("../data/t.txt",q.symbol+"\n");
	    var mpusd=0;
	    if(q.Currency && mp>0){
		switch(q.Currency.toUpperCase()){
		case "CAD":
		    mpusd = mp/1.16;
		    break;
		case "CNY":
		    mpusd = mp/6.22;
		    break;
		case "GBP":
		    mpusd = mp/0.64;
		    break;
		case "HKD":
		    mpusd = mp/7.76;
		    break;
		case "USD":
		    mpusd = mp;
		    break;
		default:
		    mpusd = 0;
		}
	    }
	    
	    return {
		stockcode:stocks[i].stockcode,
		open:q.Open,
		prevclose:q.PreviousClose,
		price:q.LastTradePriceOnly,
		volume:q.Volume,
		ticker:stocks[i].ticker,
		marketcap:mp,
		currency:q.Currency,
		marketcapusd:mpusd,
		peratio:q.PERatio,
		pegratio:q.PEGRatio,
		change:q.Change,
		percentchange:q.PercentChange,
		bid:q.Bid,
		eps:q.EPSEstimateCurrentYear,
		daysrange:q.DaysRange,
		pelyr:q.PriceEPSEstimateCurrentYear,
		oneyrtargetprice:q.OneyrTargetPrice,
		yearrange:q.YearRange,
		dividendyield:q.DividendYield,
		ask:q.Ask,
		avgvol:q.AverageDailyVolume,
		lasttradedate:q.LastTradeDate,
		lasttradetime:q.LastTradeTime
	    };
	});
	models.Quote.bulkCreate(records).then(function(a){
	    console.log("insert record success! %d",a.length);
	},function(r){
	    console.log(r);
	});
    });
});
