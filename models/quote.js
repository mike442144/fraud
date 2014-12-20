"use strict";

module.exports = function(sequelize,DataTypes){
    var Quote = sequelize.define("Quote",{
	open:DataTypes.DECIMAL(10,2),
	prevclose:DataTypes.DECIMAL(10,2),
	price:DataTypes.DECIMAL(10,2),
	volume:DataTypes.DECIMAL(10,2),
	ticker:DataTypes.STRING,
	marketcap:DataTypes.DECIMAL(10,2),
	peratio:DataTypes.DECIMAL(10,2),
	pegratio:DataTypes.DECIMAL(10,2),
	change:DataTypes.DECIMAL(10,2),
	percentchange:DataTypes.STRING,
	bid:DataTypes.DECIMAL(10,2),
	eps:DataTypes.DECIMAL(10,2),
	daysrange:DataTypes.STRING,
	pelyr:DataTypes.DECIMAL(10,2),
	oneyrtargetprice:DataTypes.DECIMAL(10,2),
	yearrange:DataTypes.STRING,
	dividendyield:DataTypes.DECIMAL(10,2),
	ask:DataTypes.DECIMAL(10,2),
	avgvol:DataTypes.DECIMAL(10,2),
	lasttradedate:DataTypes.STRING,
	lasttradetime:DataTypes.STRING
    });
    return Quote;
};
