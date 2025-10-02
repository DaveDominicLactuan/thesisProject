import { Injectable } from '@angular/core';
import * as ort from 'onnxruntime-web';

const TYPE_CLASSES = ['branching', 'diagonal', 'horizontal', 'map/web', 'vertical'];
const SHAPE_CLASSES = ['branching', 'curved', 'mapped/network', 'straight'];
const SEVERITY_CLASSES = ['hairline', 'minor', 'moderate', 'severe'];


@Injectable({
  providedIn: 'root'
})
export class CrackDetectionService {
  private session: any = null;

  /** Initialize ONNX Runtime Web session */
  private async init() {
    if (!this.session) {
      ort.env.wasm.wasmPaths = 'assets/onnx/';
      this.session = await ort.InferenceSession.create('/assets/onnx/crack_multihead_cnn.onnx');
      console.log("✅ ORT session initialized");
    }
  }

  /** Run inference on a Float32Array image tensor [1,3,128,128] */
  async runInference(inputTensor: Float32Array) {
    await this.init();

    const tensor = new ort.Tensor('float32', inputTensor, [1, 3, 128, 128]);
    const feeds: Record<string, any> = { input: tensor };

    const results = await this.session.run(feeds);
    return this.mapResults(results);
  }

  /** Convert raw ONNX output to class labels */
  private mapResults(results: Record<string, any>) {
    console.log("🧪 Raw results:", results);

    return {
      severity: SEVERITY_CLASSES[this.argmax(results['severity'].data as Float32Array)],
      shape: SHAPE_CLASSES[this.argmax(results['shape'].data as Float32Array)],
      type: TYPE_CLASSES[this.argmax(results['type'].data as Float32Array)]
    };
  }

  /** Safe argmax for Float32Array or number[] */
  private argmax(arr: Float32Array | number[]): number {
    const nums = Array.from(arr); // avoid TS reduce error
    return nums.reduce((maxIdx, val, i) => val > nums[maxIdx] ? i : maxIdx, 0);
  }
}
