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
            console.log('content: ', content);
            const response = await this.openAI.chat.completions.create({
                messages: [{ role: 'user', content}],
                model: 'gpt-4',
            });

            console.log('response: ', JSON.stringify(response));

            const {choices} = response;
            if(!Array.isArray(choices) || choices.length === 0) throw new Error('open ai response parsing error');
            
            const {message} = choices[0];
            const {content: answer} = message;
            
            console.log('response: ', JSON.stringify(response));
            console.log('answer: ', answer);
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


(async () => {
    const content = 'is chocolate bar a type of food? answer 1 for yes, 0 for no';
    const response = await openAI.completion(content);
    console.log(response);
})();