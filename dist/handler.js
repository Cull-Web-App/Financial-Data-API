"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTickers = async (event, context) => {
    console.log('The current ticker is: ' + event.queryStringParameters);
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Worked'
        })
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9oYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRWEsUUFBQSxVQUFVLEdBQVksS0FBSyxFQUFFLEtBQTJCLEVBQUUsT0FBZ0IsRUFBa0MsRUFBRTtJQUN2SCxPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixHQUFFLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3BFLE9BQU87UUFDSCxVQUFVLEVBQUUsR0FBRztRQUNmLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ2pCLE9BQU8sRUFBRSxRQUFRO1NBQ3BCLENBQUM7S0FDTCxDQUFDO0FBQ04sQ0FBQyxDQUFBIn0=