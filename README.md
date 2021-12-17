## Create a Pulse Oscillator using the Web Audio API

Many classic analogue synthesiser lead-synth and string-ensemble sounds were based upon a modulated _pulse_ waveform.
This project demonstrates a set of techniques for recreating a Pulse Oscillator using the Web Audio API.

The new oscillator is demonstrated in the following examples:
* [Example-pwm.html](http://htmlpreview.github.io/?https://github.com/pendragon-andyh/WebAudio-PulseOscillator/blob/master/example-pwm.html)
* [Example-synth.html](http://htmlpreview.github.io/?https://github.com/pendragon-andyh/WebAudio-PulseOscillator/blob/master/example-synth.html)

The _pulse_ wave is similar to a normal _square_ waveform:
![plot_square](https://user-images.githubusercontent.com/1651451/146574553-b855633d-1a2b-4e77-bd5e-a2bd01c99d4b.png "Normal square wave")

... but the "duty-cycle" or "mark-space ratio" is asymmetrical:
![plot_square_duty_wide](https://user-images.githubusercontent.com/1651451/146574582-e7d6bca3-3e90-49f0-96d0-92296b2e150a.png "Pulse wave")

This creates a very distinctive sound – especially if mark-space ratio is modulated (which is what we’re going to do here).

## Implementing the basics
### Creating sawtooth oscillator node
The `OscillatorNode` provided by the Web Audio API can create _sine_, _square_, _triangle_ and _sawtooth_ waveforms. <br>
Let start with a normal _sawtooth_ wave:

```javascript
    const audioContext = new AudioContext();
    const sawtooth = new OscillatorNode(audioContext, { type: "sawtooth", frequency: 110 });

    // connect to the destination    
    sawtooth.connect(audioContext.destination);

    // start the oscillator
    sawtooth.start(audioContext.currentTime);
    sawtooth.stop(audioContext.currentTime + 2);
```

This creates a waveform that rises from `-1` to `+1` – with an average value of `0`
![plot_sawtooth](https://user-images.githubusercontent.com/1651451/146574859-bc7cb891-3846-4968-aa1b-c3f85a32ca73.png "Normal sawtooth wave")

### Transforming sawtooth into square wave
Now lets add a `WaveShaper` node to transform the sawtooth into a square wave:

```javascript
    const audioContext = new AudioContext();

    // create new curve that will transform values [0:127] to -1 and [128:255] to +1
    const squareCurve = new Float32Array(256); 
    squareCurve.fill(-1, 0, 127);
    squareCurve.fill(1, 128, 255);

    const sawtooth = new OscillatorNode(audioContext, { type: "sawtooth", frequency: 110 });
    const squareShaper = new WaveShaperNode(audioContext, { curve: squareCurve });

    // connect everything and the destination
    sawtooth.connect(squareShaper);
    squareShaper.connect(audioContext.destination);
    
    // start the oscillator
    sawtooth.start(audioContext.currentTime);
    sawtooth.stop(audioContext.currentTime + 2);
```

Half of the sawtooth wave was below `0` and so it was translates to `-1` and other half was above `0` and so it was translates to `+1`.
![plot_sawtooth_squared](https://user-images.githubusercontent.com/1651451/146575491-eedcdbfe-012a-435c-a3cb-2bfbbc0c6150.png "Square wave produced from shaped sawtooth")

To get a pulse wave however, sawtooth wave need an offset so that its duty-cycle get longer.

### Creating offset node 
Adding constant signal of amplitude `x` will offset any wave by this value.
 
There are 2 ways of creating a constant offset value using the Web Audio API:
* create an `AudioBufferSource` where the `AudioBuffer` only contains the value that we want
* create another `WaveShaper` node that shapes all of its input values to the desired constant value

In this case, it is more convenient to use the `WaveShaper` node:
```javascript
    const audioContext = new AudioContext();
    const offset = 0.5;

    // creating curve with constant amplitude of value   
    const constantCurve = (value) => {
        const curve = new Float32Array(2);
        curve[0] = value;
        curve[1] = value;
        
        return curve; 
    }

    const sawtooth = new OscillatorNode(audioContext, { type: "sawtooth", frequency: 110 });
    const constantShaper = new WaveShaperNode(audioContext, { curve: constantCurve(offset) });

    // mixing sawtooth signal with constant on the destination thus offseting sawtooth
    sawtooth.connect(constantShaper);
    sawtooth.connect(audioContext.destination);
    constantShaper.connect(audioContext.destination);

    // start the oscillator
    sawtooth.start(audioContext.currentTime);
    sawtooth.stop(audioContext.currentTime + 2);
```

Here is pulse wave offset by `0.5`. Now its covering values from `-0.5` to `+1.5`
![plot_sawtooth_lifted](https://user-images.githubusercontent.com/1651451/146575570-bd2249b0-8789-4fff-9746-1fbbc0143fa1.png "Sawtooth lifted by 0.5")

By doing so sawtooth wave changed its amplitude value ratio from `50/50` negative/positive values to `25/75`:
![plot_sawtooth_lifted_filled](https://user-images.githubusercontent.com/1651451/146586618-e663318c-ab5b-46a7-9737-6f3bfedb73ec.png "Sawtooth lifted by 0.5 filled")

### Transforming offset signal to square wave 
Just like previously signal need to be transform by `WaveShaper` node:
```javascript
    const audioContext = new AudioContext();
    const offset = 0.5; 

    // create new curve that will transform values [0:127] to -1 and [128:255] to +1
    const squareCurve = new Float32Array(256); 
    squareCurve.fill(-1, 0, 127);
    squareCurve.fill(1, 128, 255);

    // creating curve with constant amplitude of value   
    const constantCurve = (value) => {
        const curve = new Float32Array(2);
        curve[0] = value;
        curve[1] = value;
        
        return curve; 
    }

    const sawtooth = new OscillatorNode(audioContext, { type: "sawtooth", frequency: 110 });
    const squareShaper = new WaveShaperNode(audioContext, { curve: squareCurve });
    const constantShaper = new WaveShaperNode(audioContext, { curve: constantCurve(offset) });
    
    // mixing sawtooth signal with constant, transforming into square, connecting to the destination
    sawtooth.connect(constantShaper); 
    constantShaper.connect(squareShaper);
    sawtooth.connect(squareShaper);
    squareShaper.connect(audioContext.destination);

    // start the oscillator
    sawtooth.start(audioContext.currentTime);
    sawtooth.stop(audioContext.currentTime + 2);
```

The `squareShaper` will transform this into an output where a ¼ of the output values are `-1`, and the remaining ¾ are `+1`.
![plot_sawtooth_squared_lifted](https://user-images.githubusercontent.com/1651451/146575920-d0b6b3ee-70cb-4e26-9dd6-5dc9a2e1daf0.png "Figure 6: Pulse wave when the offset is 0.5")

This is cool, but the resulting sound is a bit static. It would be better to modulate pulse's width with `AudioParam`.

## Adding modulation of the pulse width
The Web Audio API doesn’t support creation of `AudioParam` object directly so we're going to be devious again – and borrow an `AudioParam` from the `GainNode`.

The following code adds a new `createPulseOscillator` function to the `AudioContext` - and exposes a `width` parameter that can be modulated:

```javascript
let audioContext = new (window.AudioContext ||
    window.webkitAudioContext ||
    function () {
        throw "Your browser does not support Web Audio API";
    })();

// create new curve that will flatten values [0:127] to -1 and [128:255] to 1
const squareCurve = new Float32Array(256);
squareCurve.fill(-1, 0, 127);
squareCurve.fill(1, 128, 255);

// constant signal on level 1
const constantCurve = new Float32Array(2);
constantCurve[0] = 1;
constantCurve[1] = 1;

// add a new factory method to the AudioContext object.
audioContext.createPulseOscillator = () => {
    // use a normal oscillator as the basis of pulse oscillator.
    const oscillator = new OscillatorNode(audioContext, { type: "sawtooth" });
    // shape the output into a pulse wave.
    const squareShaper = new WaveShaperNode(audioContext, { curve: squareCurve });
    // pass a constant value of 1 into the widthParameter – so the "width" setting
    // is duplicated to its output.
    const constantShaper = new WaveShaperNode(audioContext, { curve: constantCurve });
    // use a GainNode as our new "width" audio parameter.
    const widthParameter = new GainNode(audioContext, { gain: 0 });

    // add parameter to oscillator node as the new attribute
    oscillator.width = widthParameter.gain;

    // connect everything
    oscillator.connect(constantShaper);
    constantShaper.connect(widthParameter);
    widthParameter.connect(squareShaper);

    // override the oscillator's "connect" and "disconnect" method so that the
    // new node's output actually comes from the squareShaper.
    oscillator.connect = () => {
        squareShaper.connect.apply(squareShaper, arguments);
    };
    oscillator.disconnect = () => {
        squareShaper.disconnect.apply(squareShaper, arguments);
    };

    return oscillator;
};
```

Constant value of `+1` is passed into the `widthParameter`. This means that whatever we do to its "gain" parameter will be reflected onto the node’s output. We attach the "gain" parameter to the oscillator node so that it becomes part of the oscillator’s interface.

Have a play - then feel free to incorporate these techniques in your own code.

## Useful links
I found the following links useful for constructing this project:
* [Web Audio API](http://www.w3.org/TR/webaudio/)
* [Sound-on-sound](http://soundonsound.com/sos/feb03/articles/synthsecrets46.asp) - There's a heap of good stuff in this series.

## License
Copyright (c) 2014 Andy Harman and Pendragon Software Limited.

Released under the MIT License.
