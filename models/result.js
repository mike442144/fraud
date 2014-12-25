"use strict";

module.exports = function(sequelize,DataTypes){
    var Result = sequelize.define("Result",{
	resultid:{
	    type:DataTypes.INTEGER,
	    primaryKey:true,
	    allowNull:false,
	    unique:true,
	    autoIncrement:true
	},
	content:'MEDIUMTEXT'
    });
    return Result;
};
