const {OpenAI} = require('openai');
const env = require('./env.json');

const {openAIKey} = env;

class OpenAIWrapper {
    constructor(){
        if(openAIKey == null) throw new Error('open ai key missing, cannot progress');
        const config = {apiKey: openAIKey};

        this.openAI = new OpenAI(config);
    }

    async completion(content){
        try{
            const response = await this.openAI.chat.completions.create({
                messages: [{ role: 'user', content}],
                model: 'gpt-4',
            });

            const {choices} = response;
            if(!Array.isArray(choices) || choices.length === 0) throw new Error('open ai response parsing error');
            
            const {message} = choices[0];
            const {content: answer} = message;
            
            // console.log('response: ', JSON.stringify(response));
            // console.log('answer: ', answer);
            return answer;
        }
        catch(err){
            console.log('completion err', err);
            throw err;
        }
    }
}


const openAI = new OpenAIWrapper();
module.exports = openAI;