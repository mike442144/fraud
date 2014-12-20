"use strict";

module.exports = function(sequelize,DataTypes){
    var Company = sequelize.define("Company",{
	companyid:{
	    type:DataTypes.INTEGER,
	    primaryKey:true,
	    allowNull:false,
	    unique:true
	},
	name:DataTypes.STRING,
	listed:DataTypes.BOOLEAN,
	desc:DataTypes.TEXT,
	website:DataTypes.STRING,
	employeecount:DataTypes.INTEGER,
	ticker:DataTypes.STRING,
	exchange:DataTypes.STRING,
	yearfounded:DataTypes.STRING,
	industry:DataTypes.STRING,
	fraud:{type:DataTypes.INTEGER,defaultValue:false},
	marketcap:DataTypes.DECIMAL(10,2),
	reputable:{type:DataTypes.BOOLEAN,defaultValue:false}
    });
    return Company;
};
