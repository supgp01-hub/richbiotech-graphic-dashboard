// Unit/regression runs must not contact production services. Each integration fixture supplies its own transport.
function blocked(){throw Error('Network disabled in regression suite; provide a mock transport');}
global.fetch=blocked;
for(const mod of ['http','https']){const api=require(mod);api.request=blocked;api.get=blocked;}
require('net').Socket.prototype.connect=blocked;
