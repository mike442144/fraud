"use strict";

modules.exports = function(sequelize,DataTypes){
    var Company = sequelize.define("Company",{
	companyid:DataTypes.STRING,
	listed:DataTypes.BOOLEAN,
	exchange:DataTypes.STRING,
	desc:DataTypes.TEXT,
	website:DataTypes.STRING,
	employeecount:DataTypes.INT,
	ticker:DataTypes.STRING,
	yearfounded:DataTypes.STRING
    });
};
