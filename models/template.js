"use strict";

module.exports = function(sequelize,DataTypes){
    var Template = sequelize.define("Template",{
	id:{
	    type:DataTypes.INTEGER,
	    primaryKey:true,
	    allowNull:false,
	    unique:true,
	    autoIncrement:true
	},
	tplname:DataTypes.STRING,
	content:DataTypes.TEXT,
	saved:DataTypes.BOOLEAN
    });
    return Template;
};
