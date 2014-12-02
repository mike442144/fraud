"use strict";

module.exports = function(sequelize,DataTypes){
    var UpdateProgress = sequelize.define("UpdateProgress",{
	id:{
	    type:DataTypes.INTEGER,
	    primaryKey:true,
	    allowNull:false,
	    unique:true,
	    autoIncrement:true
	},
	percentage:DataTypes.INTEGER,
	status:DataTypes.STRING
    });
    return UpdateProgress;
};
