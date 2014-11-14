"use strict";

module.exports = function(sequelize,DataTypes){
    var Quote = sequelize.define("Quote",{
	open:DataTypes.DECIMAL(10,2),
	prevclose:DataTypes.DECIMAL(10,2),
	price:DataTypes.DECIMAL(10,2),
	volume:DataTypes.DECIMAL(10,2),
	ticker:DataTypes.STRING,
	marketcap:DataTypes.DECIMAL(10,2),
	peratio:DataTypes.DECIMAL(6,2),
	pegratio:DataTypes.DECIMAL(6,2),
	change:DataTypes.DECIMAL(6,2)
    });
    return Quote;
};
