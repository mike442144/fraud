"use strict";

module.exports = function(sequelize,DataTypes){
    var Stock = sequelize.define("Stock",{
	stockcode:{
	    type:DataTypes.STRING,
	    primaryKey:true,
	    allowNull:false,
	    unique:true
	},
    });
    return Stock;
};
