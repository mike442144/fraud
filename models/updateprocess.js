"use strict";

module.exports = function(sequelize,DataTypes){
    var UpdateProcess = sequelize.define("UpdateProcess",{
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
    return UpdateProcess;
};
