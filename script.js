let prefixes = ['sir ', 'lich ', '', '', '', 'ser '];
let names = ['John', 'Borg', 'Thirinus', 'Morgan', 'Tuur'];
let postfixes = [' of Barenshire', ' of the Holm', ' of Breeda', ' Deere', ' the brute', ' the terrible', ' the dwarf', '', '', '', '', ''];


let sentences = [["Äpfel sind Früchte", "Apples are fruit"]];

for (let i = 0; i < 100; i++) {
    sentences.push(["de" + i, "en" + i]);
}

let points = 0;
let inventar = new Map();

let max_enemy_health = 20;
let enemy_health = 20;
let player_health = 90;
let explored = 0;

function rand(a) {
    return Math.floor(Math.random() * a);
}

function rand_choice(xs) {
    return xs[rand(xs.length)];
}

function chance(a, b) {
    b = b || 1;
    return !(Math.random() < Math.pow(1 - a, b))
}

function decrease_enemy_health(amount) {
    enemy_health -= amount;
    document.getElementById('enemy-health').value = enemy_health;
}

function decrease_player_health(amount) {
    player_health -= amount;
    document.getElementById('player-health').value = player_health;
}

function increase_explored(amount) {
    explored += amount;
    document.getElementById('explored').value = explored;
}

function show_inventar() {
    let iel = document.getElementById('inventar');
    iel.innerHTML = '';
    for (let [type, amount] of inventar) {
        let bla = document.createElement('div');
        bla.innerText = type + ': ' + amount;
        iel.insertBefore(bla, null);
    }
}

function loot_foo(xs) {
    let loot = new Map();
    xs.forEach(([name, c, max]) => {
        if (chance(c)) {
            loot.set(name, rand(max) + 1);
        }
    });
    return loot;
}

function generate_loot() {
    return loot_foo([['gold', 1, 7],
                     ['arrows', 0.5, 9],
                     ['shoes', 0.3, 2]]);
}

function generate_found_loot() {
    return loot_foo([['wood', 0.6, 6],
                     ['gold', 0.2, 3],
                     ['pumpkin spice', 0.1, 1]]);
}

function merge_with(dest, source, default_value, f) {
    for (let [key, val] of source) {
        dest.set(key, f(dest.has(key) ? dest.get(key) : default_value, val));
    }
}

function add_loot(loot) {
    merge_with(inventar, loot, 0, (a, b) => a + b);
    show_inventar();
}

function add_inventar(type, amount) {
    inventar.set(type, (inventar.get(type) || 0) + amount);
    show_inventar();
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

function create_button(text, cb) {
    let button = document.createElement('div');
    button.className = 'button';
    button.innerText = text;
    button.addEventListener('click', cb);
    return button;
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
            container.insertBefore(create_button(x[1], () => resolve(answer(qx, x))), null);
        });
        container.insertBefore(create_button('None of the above', () => {
            if (set.next) {
                resolve(ask_quiz_set(set.next));
            } else {
                resolve(answer(qx, null));
            }
        }), null);
        show(container);
    });
}

function show_next(el) {
    return new Promise((resolve, reject) => show([el, create_button('next', resolve)]));
}


function show_msg(msg) {
    let msgfoo = document.createElement('div');
    msgfoo.innerText = msg;
    return show_next(msgfoo);
}

function render_quiz_set_question(q, cb) {
    return create_button(q.q.q[0], () => {
        ask_quiz_set(q.q).then(success => {
            q.q = get_quiz_set(sentences);
            cb(success);
        });
    });
}

function show(els) {
    if (!els.forEach) {
        els = [els];
    }
    document.getElementById('workarea').innerHTML = '';
    els.forEach(el => document.getElementById('workarea').insertBefore(el, null));
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
        show(live_qs.map(q => render_quiz_set_question(q, resolve)));
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

function start_fight() {
    document.getElementById('title').innerText = 'Fighting ' + rand_choice(prefixes) + rand_choice(names) + rand_choice(postfixes) + "\n Enemy health: ";
    enemy_health = max_enemy_health;
    let prog = document.createElement('progress');
    prog.id = 'enemy-health';
    prog.max = max_enemy_health;
    prog.value = enemy_health;
    document.getElementById('title').insertBefore(prog, null);
    return start_quiz().then(success => {
        document.getElementById('title').innerHTML = '';
        if (success) {
            add_loot(generate_loot());
            return show_msg('You win!');
        } else {
            return show_msg('You die!');
        }
    });
}

function start_heal() {
    if (player_health >= 100) {
        return show_msg("You're fully healed");
    } else {
        return show_questions().then(success => decrease_player_health(success ? -8 : -2)).then(start_heal);
    }
}

function found_stuff() {
    let loot = generate_found_loot();
    add_loot(loot);
    return show_msg("found loot");
}

function explore() {
    return show_questions().then(success => {
        let amount = success ? 8 : 2;
        increase_explored(amount);
        if (explored >= 100) {
            return show_msg('explored everything!');
        }
        if (chance(0.06, amount)) {
            return start_fight();
        } else if (chance(0.1, amount)) {
            return found_stuff();
        } else {
            return explore();
        }
    });
}

function craft_crafting_table() {
    return show_questions().then(success => {
        if (success) {
            let foo = new Map();
            foo.set('wood', -4);
            foo.set('crafitng table', 1);
            add_loot(foo);
        } else {
            return craft_crafting_table();
        }
    });
}

function menu() {
    if (player_health > 0 || explored < 100) {
        show([create_button('explore', () => explore().then(menu)),
              create_button('heal', () => start_heal().then(menu))].concat(
                  inventar.get('wood') >= 4 ? [create_button('craft crafting table', () => craft_crafting_table().then(menu))] : []));
    } else {
        show_msg("Game over");
    }
}

window.addEventListener('load', () => {
    menu();
});
