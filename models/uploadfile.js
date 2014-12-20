"use strict";

module.exports = function(sequelize,DataTypes){
    var UploadedFile = sequelize.define("UploadedFile",{
	id:{
	    type:DataTypes.INTEGER,
	    primaryKey:true,
	    allowNull:false,
	    unique:true,
	    autoIncrement:true
	},
	name:DataTypes.STRING,
	real:DataTypes.STRING,
	target:DataTypes.INTEGER
    });
    return UploadedFile;
};
