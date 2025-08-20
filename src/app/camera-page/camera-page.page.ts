import {
  Component,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';

import { DomSanitizer } from '@angular/platform-browser';
import { FaceDetectionService } from '../services/face-detection.service';
import { ImageStorageService, StoredImage } from '../image-storage.service';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';

import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ScaledBox {
  x: number;
  y: number;
  w: number;
  h: number;
  original: BoundingBox;
}

@Component({
  selector: 'app-camera-page',
  templateUrl: './camera-page.page.html',
  styleUrls: ['./camera-page.page.scss'],
  standalone: false
})
export class CameraPagePage implements AfterViewInit {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  imagePreview: string | null = null;
  capturedImages: string[] = [];
  usingFrontCamera = false;
  mediaStream: MediaStream | null = null;
  extraText: string | null = null;
  photosTaken = 0;
  photosProcessed = 0;
  isProcessing: boolean = true;

  faceDetected = false; // you already use this
  scaledBoxes = [];     // you already use this
  savedImage: StoredImage | null = null;

// Optional: Used in the badge if you want to show remaining
get countdown() {
  return this.photosTaken - this.photosProcessed;
}

  ngAfterViewInit() {
    // this.initCamera();
    this.platform.ready().then(() => {
    this.initCamera();
  });
  }

  constructor(private platform: Platform, private router: Router,
              private sanitizer: DomSanitizer,
              private faceDetectionService: FaceDetectionService,
              private imageStorage: ImageStorageService) {
    // Ensure the camera is initialized when the component is created
    this.requestCameraPermission();

  }

  // async initCamera() {
  //   if (this.mediaStream) {
  //     this.mediaStream.getTracks().forEach(track => track.stop());
  //   }

  //   const constraints = {
  //     video: {
  //       facingMode: this.usingFrontCamera ? 'user' : 'environment'
  //     }
  //   };

  //   try {
  //     this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
  //     this.videoRef.nativeElement.srcObject = this.mediaStream;
  //   } catch (error) {
  //     console.error('Camera initialization error:', error);
  //   }
  // }

//   async initCamera() {
//   // 1. Stop existing stream
//   if (this.mediaStream) {
//     this.mediaStream.getTracks().forEach(track => track.stop());
//   }

//   // 2. Define constraints
//   const constraints: MediaStreamConstraints = {
//     video: {
//       facingMode: this.usingFrontCamera ? 'user' : 'environment',
//       width: { ideal: 1280 },
//       height: { ideal: 720 }
//     },
//     audio: false // disable audio unless needed
//   };

//   try {
//     // 3. Request camera stream
//     this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

//     const videoElement = this.videoRef.nativeElement;

//     // 4. Attach stream to video element
//     videoElement.srcObject = this.mediaStream;

//     // 5. Wait until video is ready
//     await new Promise<void>((resolve) => {
//       videoElement.onloadedmetadata = () => {
//         videoElement.play();
//         resolve();
//       };
//     });

//     console.log('✅ Camera initialized');
//   } catch (error: any) {
//     console.error('❌ Camera initialization error:', error);

//     if (error.name === 'NotAllowedError') {
//       alert('Camera access was denied. Please allow it in your settings.');
//     } else if (error.name === 'NotFoundError') {
//       alert('No camera found on this device.');
//     } else {
//       alert('An unknown error occurred while accessing the camera.');
//     }
//   }
// }

// async initCamera() {
//   // 🔐 Step 1: Request camera permission at runtime
//   const permissionStatus = await Permissions.request({ name: 'camera' });

//   if (permissionStatus.state !== 'granted') {
//     alert('Camera permission denied. Please allow it in your settings.');
//     return;
//   }

//   // 🛑 Stop any existing media stream
//   if (this.mediaStream) {
//     this.mediaStream.getTracks().forEach(track => track.stop());
//   }

//   const constraints: MediaStreamConstraints = {
//     video: {
//       facingMode: this.usingFrontCamera ? 'user' : 'environment',
//       width: { ideal: 1280 },
//       height: { ideal: 720 }
//     },
//     audio: false
//   };

//   try {
//     // 🎥 Request camera stream
//     this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

//     const videoElement = this.videoRef.nativeElement;
//     videoElement.srcObject = this.mediaStream;

//     // 📼 Wait for metadata before playing
//     await new Promise<void>((resolve) => {
//       videoElement.onloadedmetadata = () => {
//         videoElement.play();
//         resolve();
//       };
//     });

//     console.log('✅ Camera initialized');
//   } catch (error: any) {
//     console.error('❌ Camera initialization error:', error);

//     if (error.name === 'NotAllowedError') {
//       alert('Camera access was denied. Please allow it in your settings.');
//     } else if (error.name === 'NotFoundError') {
//       alert('No camera found on this device.');
//     } else {
//       alert('An unknown error occurred while accessing the camera.');
//     }
//   }
// }

// async initCamera() {
//   // ✅ 1. Request camera permission (via Camera plugin)
//   const permission = await Camera.requestPermissions();

//   if (permission.camera !== 'granted') {
//     alert('Camera permission denied. Please enable it in system settings.');
//     return;
//   }

//   // ✅ 2. Stop existing stream if needed
//   if (this.mediaStream) {
//     this.mediaStream.getTracks().forEach(track => track.stop());
//   }

//   // ✅ 3. Initialize stream
//   try {
//     const constraints = {
//       video: {
//         facingMode: this.usingFrontCamera ? 'user' : 'environment'
//       },
//       audio: false
//     };

//     this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
//     const videoEl = this.videoRef.nativeElement;

//     videoEl.srcObject = this.mediaStream;
//     await new Promise<void>((resolve) => {
//       videoEl.onloadedmetadata = () => {
//         videoEl.play();
//         resolve();
//       };
//     });

//     console.log('✅ Camera started');
//   } catch (err) {
//     console.error('Camera error:', err);
//     alert('Could not access the camera.');
//   }
// }

async initCamera() {
  // ✅ Step 1: Request camera permission using Capacitor Camera plugin
  if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
    const permissions = await Camera.requestPermissions();

    if (permissions.camera !== 'granted') {
      alert('Camera permission denied. Please enable it in system settings.');
      return;
    }
  }

  // ✅ Step 2: Stop existing media stream
  if (this.mediaStream) {
    this.mediaStream.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
  }

  // ✅ Step 3: Define constraints and get user media
  try {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: this.usingFrontCamera ? 'user' : 'environment',
      },
      audio: false
    };

    this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    const videoEl: HTMLVideoElement = this.videoRef.nativeElement;

    videoEl.srcObject = this.mediaStream;

    // Wait for video metadata before playing
    await new Promise<void>((resolve) => {
      videoEl.onloadedmetadata = () => {
        videoEl.play();
        resolve();
      };
    });

    console.log('✅ Live camera preview started');
  } catch (error) {
    console.error('Camera access error:', error);
    alert('Failed to access camera. Please check permissions and device compatibility.');
  }
}

  // takeManualPicture() {
  //   const video = this.videoRef.nativeElement;
  //   const canvas = this.canvasRef.nativeElement;
  //   const context = canvas.getContext('2d');

  //   const width = video.videoWidth;
  //   const height = video.videoHeight;

  //   canvas.width = width;
  //   canvas.height = height;

  //   context?.drawImage(video, 0, 0, width, height);
  //   const dataUrl = canvas.toDataURL('image/png');

  //   this.imagePreview = dataUrl;
  //   this.capturedImages.unshift(dataUrl); // add to thumbnails
  // }

  async takeManualPicture() {
  try {
    this.photosTaken++;
    this.extraText = '📸 Capturing image (manual)...';
    this.isProcessing = true;

    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    const context = canvas.getContext('2d');

    const width = video.videoWidth;
    const height = video.videoHeight;

    canvas.width = width;
    canvas.height = height;
    context?.drawImage(video, 0, 0, width, height);

    // Get image data immediately
    const dataUrl = canvas.toDataURL('image/png');

    // Show preview + add to thumbnails IMMEDIATELY
    this.imagePreview = dataUrl;
    this.capturedImages.unshift(dataUrl);

    // Convert to blob for processing
    const blob = await fetch(dataUrl).then(res => res.blob());

    const now = new Date().toISOString();
    const filename = this.generateFilename2();
    let boxedImage = dataUrl;
    let faceDetected = false;
    let faces: any[] = [];
    let detectionMessage = 'ℹ️ Manual capture: No face detected.';

    try {
      // Optional: Wrap with timeout to avoid long delays
      const detectionResult: any = await Promise.race([
        this.faceDetectionService.detectFaces(blob).toPromise(),
        new Promise((_, reject) => setTimeout(() => reject('Timeout'), 2000)) // 2 second timeout
      ]);

      faces = detectionResult.faces || [];
      faceDetected = faces.length > 0;

      if (faceDetected) {
        boxedImage = await this.drawBoxesOnImage(dataUrl, faces);
        detectionMessage = `✅ Face(s) detected: ${faces.length}`;
      }
    } catch (detectionErr) {
      console.warn('⚠️ Face detection failed or timed out:', detectionErr);
      detectionMessage = '⚠️ Detection failed – saved anyway.';
    }

    // Always store the image
    const entry: StoredImage = {
      original: dataUrl,
      withBoxes: boxedImage,
      boxes: faces,
      faceDetected,
      faceData: faces,
      timestamp: now,
      detectionMessage,
      filename
    };

    this.imageStorage.addImage(entry);
    this.imageStorage.setEntryForImage(dataUrl, entry);

    this.savedImage = entry;
    this.photosProcessed++;
    this.extraText = detectionMessage;

  } catch (err) {
    console.error('❌ Manual capture failed:', err);
    this.extraText = '❌ Manual capture failed.';
  } finally {
    this.isProcessing = false;
  }
}




//   async takeManualPicture() {
//   try {
//     this.extraText = '📸 Capturing image (manual)...';
//     this.photosTaken++;

//     const video = this.videoRef.nativeElement;
//     const canvas = this.canvasRef.nativeElement;
//     const context = canvas.getContext('2d');

//     const width = video.videoWidth;
//     const height = video.videoHeight;

//     canvas.width = width;
//     canvas.height = height;
//     context?.drawImage(video, 0, 0, width, height);

//     const dataUrl = canvas.toDataURL('image/png');
//     const blob = await fetch(dataUrl).then(res => res.blob());

//     const now = new Date().toISOString();
//     const filename = this.generateFilename();
//     let boxedImage = dataUrl;
//     let faceDetected = false;
//     let faces: any[] = [];
//     let detectionMessage = 'ℹ️ Manual capture: No face detected.';

//     // Try detecting faces
//     try {
//       const res: any = await this.faceDetectionService.detectFaces(blob).toPromise();
//       faces = res.faces || [];
//       faceDetected = faces.length > 0;

//       if (faceDetected) {
//         boxedImage = await this.drawBoxesOnImage(dataUrl, faces);
//         detectionMessage = `✅ Face(s) detected: ${faces.length}`;
//       }
//     } catch (detectionErr) {
//       console.warn('⚠️ Face detection failed:', detectionErr);
//       detectionMessage = '⚠️ Face detection error – image still saved.';
//     }

//     // Store the image regardless of detection outcome
//     const entry: StoredImage = {
//       original: dataUrl,
//       withBoxes: boxedImage,
//       boxes: faces,
//       faceDetected,
//       faceData: faces,
//       timestamp: now,
//       detectionMessage,
//       filename
//     };

//     this.imageStorage.addImage(entry);
//     this.imageStorage.setEntryForImage(dataUrl, entry);

//     this.savedImage = entry;
//     this.photosProcessed++;
//     this.extraText = detectionMessage;

//     // Add to preview/thumbnails
//     this.imagePreview = dataUrl;
//     this.capturedImages.unshift(dataUrl);

//   } catch (err) {
//     console.error('❌ Manual capture failed:', err);
//     this.extraText = '❌ Manual capture failed.';
//   }
// }


  closePreview() {
    this.imagePreview = null;
  }

  toggleCamera() {
    this.usingFrontCamera = !this.usingFrontCamera;
    this.initCamera(); // restart with new facing mode
  }

  filterThumbnails(type: string) {
    // Optional: Filtering logic by image origin
  }

  goToFeedBackPage() {
    this.router.navigate(['/feedback-page']);
    console.log('Navigating to Sign Up page');
   
  }

  onBoxClick(box: any) {
    // Your bounding box logic
  }

  ngOnDestroy(): void {
    this.mediaStream?.getTracks().forEach(track => track.stop());
  }

  async requestCameraPermission() {
  try {
    const permission = await Camera.requestPermissions();

    if (permission.camera === 'granted') {
      console.log('✅ Camera permission granted');
      this.initCamera(); // Call your custom camera init
    } else {
      alert('❌ Camera permission denied. Please allow it in system settings.');
    }
  } catch (error) {
    console.error('Permission request failed:', error);
  }
}

generateFilename(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  return `photo_${yyyy}${mm}${dd}_${hh}${min}${ss}.jpg`;
}

generateFilename2(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');

  // Use photosTaken count + 1 because it increments before calling this method
  const photoNumber = this.photosTaken;

  // Filename pattern: Photo + number + HHMM + .jpg
  // E.g. Photo1_1430.jpg (11 chars before .jpg)
  // Max length 12 chars total: "Photo1_1430.jpg" is 14 chars though
  // So remove underscore to shorten: "Photo11430.jpg" (13 chars)
  // To make sure <= 12, shorten "Photo" to "P" or "Ph"
  // Let's do "P" + number + HHMM + ".jpg"
  // Example: P11430.jpg (8 chars)
  // Let's pad number with no zero, just direct

  const filename = `P${photoNumber}${hh}${min}.jpg`; // e.g. P11430.jpg

  // Check length, if longer than 12, truncate (should not happen)
  if (filename.length > 12) {
    return filename.substring(0, 12);
  }

  return filename;
}


async drawBoxesOnImage(base64: string, boxes: BoundingBox[]): Promise<string> {
    const img = new Image();
    img.src = base64;

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d')!;

    return new Promise((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 3;
        boxes.forEach(box => ctx.strokeRect(box.x, box.y, box.w, box.h));
        resolve(canvas.toDataURL('image/jpeg'));
      };
    });
  }

  base64ToBlob(base64Data: string, contentType = ''): Blob {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = Array.from(slice).map(c => c.charCodeAt(0));
      byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays, { type: contentType });
  }

  

  goToHomePage() {
    this.router.navigate(['/home-page']);
    console.log('Navigating to Sign Up page');
   
  }

}