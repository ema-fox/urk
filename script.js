let prefixes = ['sir ', 'lich ', '', '', '', 'ser '];
let names = ['John', 'Borg', 'Thirinus', 'Morgan', 'Tuur'];
let postfixes = [' of Barenshire', ' of the Holm', ' of Breeda', ' Deere', ' the brute', ' the terrible', ' the dwarf', '', '', '', '', ''];


let sentences = [["Äpfel sind Früchte", "Apples are fruit"]];

for (let i = 0; i < 100; i++) {
    sentences.push(["de" + i, "en" + i]);
}

let points = 0;

let enemy_health = 20;
let player_health = 100;

function rand(a) {
    return Math.floor(Math.random() * a);
}

function rand_choice(xs) {
    return xs[rand(xs.length)];
}

function decrease_enemy_health(amount) {
    enemy_health -= amount;
    document.getElementById('enemy-health').value = enemy_health;
}

function decrease_player_health(amount) {
    player_health -= amount;
    document.getElementById('player-health').value = player_health;
}

function add_points(amount) {
    points += amount;
    document.getElementById('points').innerText = '' + points;
}

function get_quiz_set(xs) {
    let ys = [];
    for (let i = 0; i < 4; i++) {
        ys.push(rand_choice(xs));
    }
    if (rand(5) > 0) {
        return {'q': rand_choice(ys),
                'xs': ys};
    } else {
        let next = get_quiz_set(xs);
        return {'q': next.q,
                'xs': ys,
                'next': next};
    }
}

function shuffle(xs) {
    for (let i = 0; i < xs.length; i++) {
        let tmp = xs[i];
        let j = i + rand(xs.length - i);
        xs[i] = xs[j];
        xs[j] = tmp;
    }
}

function create_button(text) {
    let button = document.createElement('div');
    let p = new Promise((resolve, reject) => {
        button.className = 'button';
        button.innerText = text;
        button.addEventListener('click', () => resolve());
    });
    return [button, p];
}

function ask_quiz_set(set) {
    return new Promise((resolve, reject) => {
        let container = document.createElement('div');
        container.className = 'quiz-set';
        let qx = set.q;
        let xs = set.xs;
        let q = document.createElement('div');
        q.className = 'question';
        q.innerText = qx[0];
        container.insertBefore(q, null);
        xs.forEach(x => {
            let [button, p] = create_button(x[1]);
            container.insertBefore(button, null);
            p.then(() => resolve(answer(qx, x)));
        });
        let [button, p] = create_button('None of the above');
        p.then(() => {
            if (set.next) {
                resolve(ask_quiz_set(set.next));
            } else {
                resolve(answer(qx, null));
            }
        });
        container.insertBefore(button, null);
        show(container);
    });
}

function show_next(el) {
    let container = document.createElement('div');
    container.insertBefore(el, null);
    let [button, p] = create_button('next');
    container.insertBefore(button, null);
    show(container);
    return p;
}


function show_msg(msg) {
    let msgfoo = document.createElement('div');
    msgfoo.innerText = msg;
    return show_next(msgfoo);
}

function render_quiz_set_question(q) {
    let [button, p] = create_button(q.q.q[0]);
    return [button, p.then(() => {
        return ask_quiz_set(q.q).then(success => {
            q.q = get_quiz_set(sentences);
            return success;
        });
    })];
}

function show(el) {
    document.getElementById('workarea').innerHTML = '';
    document.getElementById('workarea').insertBefore(el, null);
}

function create_questions() {
    var xs = [];
    for (let i = 0; i < 5; i++) {
        xs.push({'q': get_quiz_set(sentences)});
    }
    return xs;
}

var live_qs = create_questions();
    

function show_questions() {
    return new Promise((resolve, reject) => {
        var container = document.createElement('div');
        live_qs.forEach(q => {
            let [el, p] = render_quiz_set_question(q);
            container.insertBefore(el, null);
            p.then(resolve);
        });
        show(container);
    });
}

function answer(qx, ax) {
    if (ax === qx) {
        return show_msg("you're right").then(() => true);
    } else {
        return show_msg("nope. the right answer is: " + qx[1]).then(() => false);
    }
}

function start_quiz() {
    return show_questions().then(success => {
        decrease_enemy_health(success ? 8 : 2);
        if (enemy_health <= 0) {
            return true;
        }
        decrease_player_health(rand_choice([2, 8]));
        if (player_health <= 0) {
            return false;
        }
        return start_quiz();
    });
}

window.addEventListener('load', () => {
    document.getElementById('title').innerText = 'Fighting ' + rand_choice(prefixes) + rand_choice(names) + rand_choice(postfixes);
    start_quiz().then(success => {
        if (success) {
            return show_msg('You win!');
        } else {
            return show_msg('You die!');
        }
    }).then(() => show(document.createElement('div')));
});
