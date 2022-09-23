let decoder;

const examples =
{
  'Without formant preservation':
  [
    '-q 0 -p 0.5',
    '-q 0 -p 0.75',
    '-q 0 -p 1.5',
    '-q 0 -p 2',
    '-q 0 -p 1,1.25,1.5'
  ],
  'With formant preservation':
  [
    '-q 1 -p 0.5',
    '-q 1 -p 0.75',
    '-q 1 -p 1.5',
    '-q 1 -p 2',
    '-q 1 -p 1,1.25,1.5'
  ],
  'Timbre changing':
  [
    '-q 1 -p 1 -t 0.8',
    '-q 1 -p 1 -t 1.2',
    '-q 1 -p 1,1.25,1.5 -t 0.8',
    '-q 1 -p 1,1.25,1.5 -t 1.2'
  ]
};

async function download(url)
{
  const response = await fetch(url);
  const data = response.arrayBuffer();

  return data;
}

function decode(wav)
{
  decoder = decoder || new AudioContext();
  const buffer = decoder.decodeAudioData(wav);

  return buffer;
}

function encode(buffer)
{
  const samplerate = buffer.sampleRate;
  const channels = buffer.numberOfChannels;
  const data = Array.from(new Array(channels), (i) => buffer.getChannelData(i));

  const encoder = new WavAudioEncoder(samplerate, channels);
  encoder.encode(data);
  const wav = encoder.finish();

  return wav;
}

function prebuild()
{
  const tasks = [];

  const placeholder = document.getElementById('placeholder');
  const container = document.getElementById('container');

  placeholder.innerHTML = [
    `<div id="example" class="card shadow-sm example trans">`,
    `  <div class="card-body">`,
    `    <div class="audio">`,
    `      <audio id="input" src="" type="audio/wav"></audio>`,
    `    </div>`,
    `  </div>`,
    `  <div class="card-footer">`,
    `    <p class="card-text text-start text-muted"><samp>original record</samp></p>`,
    `  </div>`,
    `</div>`
  ].join('');

  Object.keys(examples).forEach((category, i) =>
  {
    const title = document.createElement('h2');

    title.classList.add('mb-4');

    if (i > 0) {
      title.classList.add('mt-5');
    }

    title.innerText = category;

    container.appendChild(title);

    const cards = document.createElement('div');

    cards.classList.add('row', 'row-cols-1', 'row-cols-sm-1', 'row-cols-md-2', 'row-cols-lg-2', 'row-cols-xl-3', 'g-3');

    examples[category].forEach((example, j) =>
    {
      const card = document.createElement('div');

      card.classList.add('col');

      card.innerHTML = [
        `<div id="example-${i}-${j}" class="card shadow-sm example trans">`,
        `  <div class="card-body">`,
        `    <div class="audio">`,
        `      <audio id="output-${i}-${j}" src="" type="audio/wav"></audio>`,
        `    </div>`,
        `  </div>`,
        `  <div class="card-footer">`,
        `    <p class="card-text text-start text-muted"><samp>${example}</samp></p>`,
        `  </div>`,
        `</div>`
      ].join('');

      cards.appendChild(card);

      tasks.push({
        example: example,
        i: i,
        j: j
      });

    });

    container.appendChild(cards);
  });

  return tasks;
}

function postbuild(input, tasks)
{
  console.debug('Processing', input);

  const wav = encode(input);

  const parent = document.getElementById('example');
  const child = document.getElementById('input');

  if (child.src) {
    URL.revokeObjectURL(child.src);
  }

  requestAnimationFrame(() => {
    child.src = URL.createObjectURL(wav);
    parent.classList.remove('trans');
  });

  function process(task)
  {
    const example = task.example;
    const i = task.i;
    const j = task.j;

    console.debug(`Building example "${example}"`);

    const output = shiftpitch(input, example);
    const wav = encode(output);

    const parent = document.getElementById(`example-${i}-${j}`);
    const child = document.getElementById(`output-${i}-${j}`);

    if (child.src) {
      URL.revokeObjectURL(child.src);
    }

    requestAnimationFrame(() => {
      child.src = URL.createObjectURL(wav);
      parent.classList.remove('trans');
    });
  }

  function schedule()
  {
    let task = tasks.shift();

    if(!task) {
      return;
    }

    if ('requestIdleCallback' in window)
    {
      requestIdleCallback(() =>
      {
        process(task);

        if(tasks.length) {
          schedule();
        }
      });
    }
    else
    {
      setTimeout(() =>
      {
        process(task);

        if(tasks.length) {
          schedule();
        }
      },
      100);
    }
  }

  schedule();
}

function build()
{
  const tasks = prebuild();

  download('voice.wav').then(decode).then((input) =>
  {
    postbuild(input, tasks);
  });
}
