let seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
const challengeDefault = [
    {
        'size': [6, 6],
        'type': {
            'cross': window.CUSTOM_CROSS,
            'square': [0, 3]
        },
        'special': {}
    }
]

window.onload = function() {
    let toLoad = new URL(window.location.href).hash;
    if (toLoad) seed = Math.floor(Number(toLoad.slice(1)));
    
}

function random(max = -1) {
    let x = Math.sin(seed) * 10000; 
    seed = (seed + 1) % Number.MAX_SAFE_INTEGER;
    let res = x - Math.floor(x);
    if (max === -1) return res;
    return Math.floor(res * max);
}