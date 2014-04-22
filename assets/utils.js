/*!
* Tony.JS WebAudio Library - http://github.com/pendragon-andyh/tony.js/
* Copyright 2014, Andy Harman
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy,
* modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
* WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
* COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
* ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
;

//Wire-up the controls for a synth's settings panel.
function setupSynthControls($parent, playFn, isAutoPlay) {
	var player;

	function autoPlay() {
		if(isAutoPlay) {
			//Apply some debouncing so that we don't get too many notes playing when range-slider is moving.
			clearTimeout(player);
			player=setTimeout(playFn, 200);
		}
	}

	//Automatically play the sound when select-fields are changed.
	$parent.find("select").change(function() {
		autoPlay();
	});

	//Processing for range inputs.
	$parent.find("input[type=range]").each(function() {
		var $x=$(this);

		//Get the min/max values for the range.
		var minValue=$x.attr("min")-0;
		var maxValue=$x.attr("max")-0;

		//Range inputs only allow integers - so find out the factor that we are multiplying-by.
		var multiplier=$x.attr("data-multiplier");
		if(multiplier) {
			multiplier-=0;
		} else {
			multiplier=1;
		}

		//Create a normal input field
		var lastValue=$x.val()/multiplier;
		var $tb=$('<input type="text" class="form-control"></input>').insertAfter($x).val(lastValue);

		//When the range-slider changes then play the sound.
		$x.change(function() {
			$tb.val(lastValue=$x.val()/multiplier);
			autoPlay();
		});

		//When the input-field changes then change the range-slider.
		$tb.change(function() {
			var val=$tb.val()*multiplier;
			if(isNaN(val)) { val=lastValue; }
			if(val<minValue) { val=minValue; }
			if(val>maxValue) { val=maxValue; }
			$x.val(val);
			$x.change();
		});
	});
}

//Standardise the requestAnimationFrame.
window.requestAnimFrame=(function() {
	return window.requestAnimationFrame||
		window.webkitRequestAnimationFrame||
		window.mozRequestAnimationFrame||
		window.oRequestAnimationFrame||
		window.msRequestAnimationFrame||
		function(callback, element) { window.setTimeout(callback, 1000/60); };
})();


function renderAnalysis(canvasSpectrum, canvasWaveform, analyser) {
	var ctxSpectrum=canvasSpectrum.getContext('2d');
	ctxSpectrum.fillStyle="blue";

	var freqData=new Uint8Array(analyser.frequencyBinCount);
	analyser.getByteFrequencyData(freqData);
	var length=freqData.length;
	var W=canvasSpectrum.width;
	var H=canvasSpectrum.height;

	ctxSpectrum.clearRect(0, 0, W, H);
	ctxSpectrum.beginPath();
	ctxSpectrum.fillStyle="#acd";
	ctxSpectrum.moveTo(0, H);
	var iStart=0;
	var iStop=Math.floor(length/2);
	var range=iStop-iStart;
	for(var i=iStart;i<=iStop;++i) {
		ctxSpectrum.lineTo(W*(i-iStart)/range, H*(1-(freqData[i]/256.0)));
	}
	ctxSpectrum.lineTo(W, H);
	ctxSpectrum.fill();

	var ctxWaveform=canvasWaveform.getContext('2d');
	ctxWaveform.fillStyle="blue";

	var waveData=new Uint8Array(analyser.fftSize);
	analyser.getByteTimeDomainData(waveData);
	var length=waveData.length;
	var W=canvasWaveform.width;
	var H=canvasWaveform.height;

	ctxWaveform.clearRect(0, 0, W, H);
	ctxWaveform.beginPath();
	ctxWaveform.strokeStyle="#acd";
	ctxWaveform.moveTo(0, (0.1+0.8*waveData[0]/256.0)*H);
	for(var i=0;i<length;++i) {
		ctxWaveform.lineTo(W*i/length, (0.1+0.8*waveData[i]/256.0)*H);
	}
	ctxWaveform.stroke();
}
