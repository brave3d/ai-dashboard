import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import ModelSelector from './ModelSelector';
import ImageUpload from './ImageUpload';

function GenerationForm() {
  const { 
    selectedModel, 
    setSelectedModel, 
    generateImage, 
    isLoading, 
    uploadedImage, 
    handleFileUpload,
    appendLog 
  } = useAppContext();

  // Form state
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [seed, setSeed] = useState(-1);
  const [steps, setSteps] = useState(4);
  const [imageStrength, setImageStrength] = useState(0.7);
  const [advancedMode, setAdvancedMode] = useState(false);

  // Reset seed to random
  const randomizeSeed = () => {
    const newSeed = Math.floor(Math.random() * 2147483647);
    setSeed(newSeed);
    appendLog(`Set random seed: ${newSeed}`);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Collect parameters
    const params = {
      prompt,
      negative_prompt: negativePrompt || undefined,
      width,
      height,
      seed: seed === -1 ? undefined : seed,
      steps,
      image_strength: imageStrength,
      input_image: uploadedImage, // Optional
    };
    
    // Call generate function from context
    await generateImage(params);
  };

  // Handle model change
  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    handleFileUpload(file);
  };

  return (
    <form id="generationForm" onSubmit={handleSubmit} className="space-y-4 mb-8 card bg-base-200 shadow-xl p-6">
      <h2 className="text-xl font-semibold mb-4 card-title">Generation Parameters</h2>
      
      {/* Model Selector */}
      <ModelSelector selectedModel={selectedModel} onModelChange={handleModelChange} />
      
      {/* Basic Prompt Input */}
      <div className="form-control">
        <label htmlFor="prompt" className="label">
          <span className="label-text">Prompt</span>
        </label>
        <textarea
          id="prompt"
          name="prompt"
          className="textarea textarea-bordered h-24"
          placeholder="Enter your prompt here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
        ></textarea>
      </div>
      
      {/* Negative Prompt (Collapsible in Basic Mode) */}
      <div className={`form-control ${!advancedMode && 'hidden'}`}>
        <label htmlFor="negativePrompt" className="label">
          <span className="label-text">Negative Prompt</span>
        </label>
        <textarea
          id="negativePrompt"
          name="negativePrompt"
          className="textarea textarea-bordered h-12"
          placeholder="Enter negative prompt here..."
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
        ></textarea>
      </div>
      
      {/* Image Upload */}
      <div className={`${!advancedMode && 'hidden'}`}>
        <h3 className="text-md font-semibold mb-2">Input Image (optional)</h3>
        <ImageUpload onFileSelect={handleFileSelect} uploadedImageUrl={uploadedImage} />
      </div>
      
      {/* Image Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label htmlFor="width" className="label">
            <span className="label-text">Width</span>
          </label>
          <select 
            id="width" 
            name="width"
            className="select select-bordered w-full" 
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          >
            <option value="512">512</option>
            <option value="768">768</option>
            <option value="1024">1024</option>
            <option value="1280">1280</option>
            <option value="1536">1536</option>
            <option value="2048">2048</option>
          </select>
        </div>
        
        <div className="form-control">
          <label htmlFor="height" className="label">
            <span className="label-text">Height</span>
          </label>
          <select 
            id="height" 
            name="height"
            className="select select-bordered w-full" 
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          >
            <option value="512">512</option>
            <option value="768">768</option>
            <option value="1024">1024</option>
            <option value="1280">1280</option>
            <option value="1536">1536</option>
            <option value="2048">2048</option>
          </select>
        </div>
      </div>
      
      {/* Advanced Parameters - Steps and Seed */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!advancedMode && 'hidden'}`}>
        <div className="form-control">
          <label htmlFor="steps" className="label">
            <span className="label-text">Inference Steps</span>
            <span className="label-text-alt">{steps}</span>
          </label>
          <input
            id="steps"
            name="steps"
            type="range"
            min="1"
            max="50"
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
            className="range range-primary"
          />
        </div>
        
        <div className="form-control">
          <label htmlFor="seed" className="label">
            <span className="label-text">Seed</span>
            <span className="label-text-alt">{seed === -1 ? 'Random' : seed}</span>
          </label>
          <div className="flex gap-2">
            <input
              id="seed"
              name="seed"
              type="number"
              min="-1"
              max="2147483647"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="input input-bordered w-full"
            />
            <button 
              type="button" 
              onClick={randomizeSeed}
              className="btn btn-square btn-outline" 
              title="Randomize seed"
            >
              🎲
            </button>
          </div>
        </div>
      </div>
      
      {/* Image Strength Slider (only shown when an image is uploaded) */}
      {uploadedImage && (
        <div className="form-control">
          <label htmlFor="imageStrength" className="label">
            <span className="label-text">Image Strength</span>
            <span className="label-text-alt">{imageStrength.toFixed(2)}</span>
          </label>
          <input
            id="imageStrength"
            name="imageStrength"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={imageStrength}
            onChange={(e) => setImageStrength(Number(e.target.value))}
            className="range range-primary"
          />
        </div>
      )}
      
      {/* Advanced Mode Toggle */}
      <div className="form-control">
        <label className="flex items-center cursor-pointer justify-end space-x-2">
          <span className="label-text">Advanced Mode</span> 
          <input 
            type="checkbox" 
            className="toggle toggle-primary" 
            checked={advancedMode}
            onChange={() => setAdvancedMode(!advancedMode)}
          />
        </label>
      </div>

      <div className="card-actions justify-end">
        <button type="submit" id="generateBtn" className="btn btn-primary" disabled={isLoading || !selectedModel}>
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : null}
          Generate
        </button>
      </div>
    </form>
  );
}

export default GenerationForm; 