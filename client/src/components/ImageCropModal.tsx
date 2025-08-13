import { useState, useRef, useCallback } from 'react';
import ReactCrop, { 
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crop as CropIcon, Check, X } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob, fileName: string) => void;
  fileName: string;
}

// This is to demonstate how to make and center a % aspect crop
// which is a bit trickier so we use some helper functions.
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ImageCropModal({ 
  isOpen, 
  onClose, 
  imageSrc, 
  onCropComplete, 
  fileName 
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [processing, setProcessing] = useState(false);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const pixelRatio = window.devicePixelRatio;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
      canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingQuality = 'high';

      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;

      const centerX = image.naturalWidth / 2;
      const centerY = image.naturalHeight / 2;

      ctx.save();

      ctx.translate(-cropX, -cropY);
      ctx.translate(centerX, centerY);
      ctx.translate(-centerX, -centerY);
      ctx.drawImage(
        image,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
      );

      ctx.restore();

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error('Failed to create blob');
          }
          resolve(blob);
        }, 'image/jpeg', 0.95);
      });
    },
    []
  );

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop || !crop) return;

    setProcessing(true);
    
    try {
      const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
      onCropComplete(croppedImageBlob, fileName);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] flex flex-col bg-slate-900 border-slate-700">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-white flex items-center">
            <CropIcon className="mr-2 h-5 w-5" />
            Ajustar Foto de Perfil
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Ajuste sua foto de perfil. Use o quadrado para selecionar a área que deseja usar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col items-center space-y-4 py-4 overflow-auto">
          <div className="relative w-full flex justify-center">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              circularCrop={false}
              keepSelection
              className="max-w-full"
            >
              <img
                ref={imgRef}
                alt="Imagem para recortar"
                src={imageSrc}
                style={{ transform: 'scale(1) rotate(0deg)' }}
                onLoad={onImageLoad}
                className="max-w-full max-h-[50vh] object-contain"
              />
            </ReactCrop>
          </div>

          <div className="flex items-center justify-center space-x-4 w-full">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-slate-300 font-medium">Formato:</label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={aspect === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAspect(1)}
                  className="text-xs px-4 py-2 border-slate-600 hover:bg-slate-700"
                >
                  Quadrado
                </Button>
                <Button
                  type="button"
                  variant={aspect === undefined ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAspect(undefined)}
                  className="text-xs px-4 py-2 border-slate-600 hover:bg-slate-700"
                >
                  Livre
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 flex justify-end space-x-3 pt-4 border-t border-slate-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={processing}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white px-6"
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleCropComplete}
            disabled={!completedCrop || processing}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-6"
          >
            {processing ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>Confirmar Crop</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}