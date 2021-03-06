const CustomError = require('./CustomError');
const fs = require('fs');
const os = require('os');

let credentials = {
	keys:['SELLING_PARTNER_APP_CLIENT_ID', 'SELLING_PARTNER_APP_CLIENT_SECRET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SELLING_PARTNER_ROLE'],
	getHomeDir:() => {
    let env = process.env;
    let home_dir = env.HOME || env.USERPROFILE || (env.HOMEPATH ? ((env.HOMEDRIVE || 'C:/') + env.HOMEPATH) : null);
    if (home_dir){
      return home_dir;
    }
    if (typeof os.homedir === 'function'){
      return os.homedir();
    }
    return;
  },
  extractFromFile:(credentials_file) => {
  	let file_content = fs.readFileSync(credentials_file);
  	file_content = file_content.toString();
		let lines = file_content.split('\n');
		let found_credentials = {};
		lines.forEach((line)=>{
			let line_split = line.split('=');
			let key = line_split[0].trim();
			if (line_split.length === 2 && credentials.keys.includes(key)){
				found_credentials[key] = line_split[1].trim();
			}
		});
		return found_credentials;
  },
  extractFromEnvVars:() => {
  	let found_credentials = {};
  	credentials.keys.forEach((key) => {
      let value = process.env[key.trim()];
      if (value){
      	found_credentials[key.trim()] = value.trim();
      }
    });
    return found_credentials;
  },
  load:(path) => {
		let credentials_file = path ? path : credentials.getHomeDir() + '/.amzspapi/credentials';

		let found_credentials;
		try {
			found_credentials = credentials.extractFromFile(credentials_file);
		} catch(e){
			found_credentials = credentials.extractFromEnvVars();
		}

		if (Object.keys(found_credentials).length === credentials.keys.length){
			return {
				'app_client':{
					id:found_credentials['SELLING_PARTNER_APP_CLIENT_ID'],
					secret:found_credentials['SELLING_PARTNER_APP_CLIENT_SECRET']
				},
				'aws_user':{
					id:found_credentials['AWS_ACCESS_KEY_ID'],
		      secret:found_credentials['AWS_SECRET_ACCESS_KEY'],
		      role:found_credentials['AWS_SELLING_PARTNER_ROLE']
				}
			};
		}

		let missing_credentials = credentials.keys.filter((key) => {
			return !Object.keys(found_credentials).includes(key);
		});
		throw new CustomError({
  		code:'CREDENTIALS_MISSING',
  		message:'Could not find the following credentials: ' + missing_credentials.join(',') 
  	});
	}
};

module.exports = {
	load:credentials.load
};