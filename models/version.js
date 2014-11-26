"use strict";

module.exports = function(sequelize,DataTypes){
    var Version = sequelize.define("Version",{
	id:{
	    type:DataTypes.INTEGER,
	    primaryKey:true,
	    allowNull:false,
	    unique:true,
	    autoIncrement:true
	},
	success:DataTypes.INTEGER,
	failed:DataTypes.INTEGER,
	log:DataTypes.TEXT,
	items:DataTypes.TEXT
    });
    return Version;
};
