var YQL = require('yql');
var models = require("../../models");

function genQuery(stocks){
    var symbol_array = stocks.map(function(stock){
	return stock.stockcode;
    });
    var str = symbol_array.join('","');
    var q = 'select AverageDailyVolume,symbol,LastTradePriceOnly,Volume,PercentChange,StockExchange,PERatio,PEGRatio,Open,PreviousClose,Ask,Bid,OneyrTargetPrice,DaysRange,YearRange,MarketCapitalization,EPSEstimateCurrentYear,PriceEPSEstimateCurrentYear,DividendYield,Change,LastTradeTime,LastTradeDate from yahoo.finance.quotes where symbol in ("'+str+'")';
    console.log(q);
    return new YQL(q);
}


models.Stock.findAll({attribute:['stockcode']}).then(function(stocks){
    
    genQuery(stocks).exec(function(err, data) {
	if(!data.query.results){
	    console.log("request failed.");
	    return;
	}
	var records = data.query.results.quote.map(function(q,i){
	    return {
		stockcode:q.symbol,
		open:q.Open,
		prevclose:q.PreviousClose,
		price:q.LastTradePriceOnly,
		volume:q.Volume,
		ticker:stocks[i].ticker,
		marketcap:q.MarketCapitalization,
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
