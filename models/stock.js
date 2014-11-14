"use strict";

module.exports = function(sequelize,DataTypes){
    var Stock = sequelize.define("Stock",{
	stockcode:{
	    type:DataTypes.STRING,
	    primaryKey:true,
	    allowNull:false,
	    unique:true
	},
	exchange:DataTypes.STRING,
	ticker:DataTypes.STRING,
	start:DataTypes.DATE,
	end:DataTypes.DATE,
	sector:DataTypes.STRING,
	industry:DataTypes.STRING,
    });
    return Stock;
};
