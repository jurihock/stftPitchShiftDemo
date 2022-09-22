let decoder;

const examples =
{
  "Without formant preservation":
  [
    "-q 0 -p 0.5",
    "-q 0 -p 0.75",
    "-q 0 -p 1.5",
    "-q 0 -p 2",
    "-q 0 -p 1,1.25,1.5"
  ],
  "With formant preservation":
  [
    "-q 1 -p 0.5",
    "-q 1 -p 0.75",
    "-q 1 -p 1.5",
    "-q 1 -p 2",
    "-q 1 -p 1,1.25,1.5"
  ],
  "Timbre changing":
  [
    "-q 1 -p 1 -t 0.8",
    "-q 1 -p 1 -t 1.2",
    "-q 1 -p 1,1.25,1.5 -t 0.8",
    "-q 1 -p 1,1.25,1.5 -t 1.2"
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

  const container = document.getElementById('container');

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
        `      <audio id="output-${i}-${j}" src="" type="audio/wav"/>`,
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
  function process(task)
  {
    const example = task.example;
    const i = task.i;
    const j = task.j;

    requestAnimationFrame(() => {
      document.getElementById(`example-${i}-${j}`).classList.remove(`trans`);
    });

    console.debug(`Building example "${example}"`);

    const output = shiftpitch(input, example);
    const wav = encode(output);

    const audio = document.getElementById(`output-${i}-${j}`);

    if (audio.src) {
      URL.revokeObjectURL(audio.src);
    }

    audio.src = URL.createObjectURL(wav);
  }

  function schedule(delay)
  {
    let task = tasks.shift();

    if(!task) {
      return;
    }

    setTimeout(() =>
    {
      process(task);

      if(tasks.length) {
        schedule(delay);
      }
    },
    delay);
  }

  schedule(100);
}

function build(input)
{
  console.debug(`Processing`, input);

  const tasks = prebuild();

  setTimeout(() =>
  {
    postbuild(input, tasks);
  },
  100);
}
