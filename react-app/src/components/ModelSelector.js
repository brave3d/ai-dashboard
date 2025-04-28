import React from 'react';
import { MODELS } from '../data/models'; // Import models

function ModelSelector({ selectedModel, onModelChange }) {
  return (
    <div className="form-control w-full mb-4">
      <label className="label">
        <span className="label-text">Select Model Endpoint</span>
      </label>
      <select
        id="modelSelect"
        name="model"
        className="select select-bordered w-full"
        value={selectedModel}
        onChange={onModelChange}
      >
        <option value="">Select an endpoint</option>
        {MODELS.map((model) => (
          <option key={model.model_path} value={model.model_path}>
            {model.name} ({model.category})
          </option>
        ))}
      </select>
    </div>
  );
}

export default ModelSelector; 