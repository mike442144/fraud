"use strict";

module.exports = function(sequelize,DataTypes){
    var Company = sequelize.define("Company",{
	companyid:{
	    type:DataTypes.INTEGER,
	    primaryKey:true,
	    allowNull:false,
	    unique:true
	},
	listed:DataTypes.BOOLEAN,
	desc:DataTypes.TEXT,
	website:DataTypes.STRING,
	employeecount:DataTypes.INTEGER,
	ticker:DataTypes.STRING,
	yearfounded:DataTypes.STRING,
	industry:DataTypes.STRING,
	fraud:DataTypes.INTEGER
    });
    return Company;
};
