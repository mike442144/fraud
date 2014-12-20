var lib={};

lib.extendResponse = function(express){
    express.response.success = function(obj,msg){
	this.json({success:true,message:msg||null,data:obj});
    }
    
    express.response.error = function(msg,code){
	var body = {success:false,data:null,message:null};
	if(typeof msg === "string"){
	    body.message = msg;
	}
	if(typeof code === "number"){
	    this.status(code);
	}
	this.json(body);
    }
}

module.exports = lib;