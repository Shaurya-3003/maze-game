// jshint esversion:6

const { Engine, World, Render, Bodies, Runner, Body, Events } = Matter;
const width = window.innerWidth, height = window.innerHeight;
const rows = 8, columns = 12;
const unitWidthLength = width / columns, unitHeightLength = height / rows;
const grid = Array(rows).fill(null).map(() => Array(columns).fill(false));
const verticals = Array(rows).fill(null).map(() => Array(columns - 1).fill(false));
const horizontals = Array(rows - 1).fill(null).map(() => Array(columns).fill(false));

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
    element: document.body,
    engine,
    options: {
        width,
        height,
        wireframes: false
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);


const walls = [
    Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
    Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
    Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
    Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];

World.add(world, walls);


const shuffle = arr => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const startRow = Math.floor(Math.random() * rows);
const startColumn = Math.floor(Math.random() * columns);

const stepThroughCell = (row, column) => {
    if (grid[row][column]) {
        return;
    }
    grid[row][column] = true;
    const neighbours = shuffle([
        [row - 1, column, 'up'],
        [row, column - 1, 'left'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down']
    ]);
    for (let neighbour of neighbours) {
        const [nextRow, nextColumn, direction] = neighbour;
        if (nextRow < 0 || nextRow >= rows || nextColumn < 0 || nextColumn >= columns) {
            continue;
        }
        if (grid[nextRow][nextColumn]) {
            continue;
        }
        if (direction === 'left') {
            verticals[row][column - 1] = true;
        }
        else if (direction === 'right') {
            verticals[row][column] = true;
        }
        else if (direction == 'up') {
            horizontals[row - 1][column] = true;
        }
        else {
            horizontals[row][column] = true;
        }
        stepThroughCell(nextRow, nextColumn);
    }
};

stepThroughCell(startRow, startColumn);



verticals.forEach((row, rowIndex) => {
    row.forEach((val, columnIndex) => {
        if (val) return;
        const segment = Bodies.rectangle((1 + columnIndex) * unitWidthLength, (0.5 + rowIndex) * unitHeightLength, 5, unitHeightLength, { isStatic: true, label: 'wall', render: { fillStyle: 'red' } });
        World.add(world, segment);
    });
});

horizontals.forEach((row, rowIndex) => {
    row.forEach((val, columnIndex) => {
        if (val) return;
        const segment = Bodies.rectangle((0.5 + columnIndex) * unitWidthLength, (1 + rowIndex) * unitHeightLength, unitWidthLength, 5, { isStatic: true, label: 'wall', render: { fillStyle: 'red' } });
        World.add(world, segment);
    });
});

const goal = Bodies.rectangle(width - 0.5 * unitWidthLength, height - 0.5 * unitHeightLength, 0.7 * unitWidthLength, 0.7 * unitHeightLength, { isStatic: false, label: 'goal', render: { fillStyle: 'green' } });
World.add(world, goal);

const ball = Bodies.circle(0.4 * unitWidthLength, 0.4 * unitHeightLength, 0.4 * Math.min(unitHeightLength, unitWidthLength), { label: 'ball', render: { fillStyle: 'blue' } });
World.add(world, ball);

document.addEventListener('keydown', e => {
    const code = e.keyCode;
    const { x, y } = ball.velocity;
    if (code === 87) {
        Body.setVelocity(ball, { x, y: y - 5 });
    }
    else if (code === 65) {
        Body.setVelocity(ball, { x: x - 5, y });
    }
    else if (code === 83) {
        Body.setVelocity(ball, { x, y: y + 5 });
    }
    else if (code === 68) {
        Body.setVelocity(ball, { x: x + 5, y });
    }

});

Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(collision => {
        const labels = ['ball', 'goal'];
        if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
            world.gravity.y = 1;
            world.bodies.filter(body => body.label === 'wall').forEach(wall => Body.setStatic(wall, false));
            document.querySelector('.winner').classList.remove('hidden');
        }
    });
});