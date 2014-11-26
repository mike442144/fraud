"use strict";

module.exports = function(sequelize,DataTypes){
    var CompanySet = sequelize.define("CompanySet",{
	setid:{
	    type:DataTypes.INTEGER,
	    primaryKey:true,
	    allowNull:false,
	    unique:true,
	    autoIncrement:true
	},
	companycount:DataTypes.INTEGER,
	companylist:DataTypes.TEXT
    });
    return CompanySet;
};
