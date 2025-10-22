import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Upload, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateStorylineProps {
  onCreated?: () => void;
  userProfile?: { username: string; avatar_url: string };
}

export const CreateStoryline: React.FC<CreateStorylineProps> = ({ onCreated, userProfile }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [starPrice, setStarPrice] = useState<number>(0);

  const handleCardClick = () => {
    setShowWelcome(true);
  };

  const handleUploadClick = () => {
    setShowWelcome(false);
    setOpen(true);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: `File must be less than ${file.type.startsWith('video/') ? '100MB' : '10MB'}`,
        variant: 'destructive'
      });
      return;
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!user || !mediaFile) return;

    setLoading(true);
    try {
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${user.id}/stories/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(fileName, mediaFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(fileName);

      let previewUrl = publicUrl;
      if (previewFile) {
        const previewExt = previewFile.name.split('.').pop();
        const previewFileName = `${user.id}/stories/preview-${Date.now()}.${previewExt}`;

        const { error: previewError } = await supabase.storage
          .from('post-media')
          .upload(previewFileName, previewFile);

        if (!previewError) {
          const { data: { publicUrl: previewPublicUrl } } = supabase.storage
            .from('post-media')
            .getPublicUrl(previewFileName);
          previewUrl = previewPublicUrl;
        }
      }

      let musicUrl = null;
      if (musicFile) {
        const musicExt = musicFile.name.split('.').pop();
        const musicFileName = `${user.id}/stories/music-${Date.now()}.${musicExt}`;

        const { error: musicError } = await supabase.storage
          .from('post-media')
          .upload(musicFileName, musicFile);

        if (!musicError) {
          const { data: { publicUrl: musicPublicUrl } } = supabase.storage
            .from('post-media')
            .getPublicUrl(musicFileName);
          musicUrl = musicPublicUrl;
        }
      }

      const { error: insertError } = await supabase
        .from('user_storylines')
        .insert({
          user_id: user.id,
          media_url: publicUrl,
          preview_url: previewUrl,
          music_url: musicUrl,
          caption: caption,
          star_price: starPrice,
          media_type: mediaFile.type.startsWith('video/') ? 'video' : 'image'
        });

      if (insertError) throw insertError;

      toast({ title: 'Success', description: 'Story created!' });
      setOpen(false);
      setMediaFile(null);
      setMediaPreview('');
      setCaption('');
      setPreviewFile(null);
      setMusicFile(null);
      setStarPrice(0);
      if (onCreated) onCreated();
    } catch (error) {
      console.error('Error creating story:', error);
      toast({ title: 'Error', description: 'Failed to create story', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Story Card - Click to show welcome */}
      <div 
        onClick={handleCardClick}
        className="flex-shrink-0 w-24 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="relative">
          <div className="w-24 h-32 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center border-2 border-primary">
            <Plus className="h-8 w-8 text-white" />
          </div>
          {userProfile && (
            <Avatar className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 h-10 border-2 border-background">
              <AvatarImage src={userProfile.avatar_url} />
              <AvatarFallback>{userProfile.username?.[0]}</AvatarFallback>
            </Avatar>
          )}
        </div>
        <p className="text-xs text-center mt-4 font-medium">Create Story</p>
      </div>

      {/* Welcome Message Dialog */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">✨ Welcome to StarStory! ✨</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 text-sm">
            <Alert>
              <AlertDescription>
                <p className="font-semibold mb-2">Share your story, earn Stars, and inspire the world!</p>
                <p>Welcome to SAVE MORE StarStory, the home of creative minds and premium stories.</p>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p>🌍 Here, every video, photo, or short story you post has real value — because your viewers pay in Stars to unlock your content.</p>
              <p>🪄 Set how many Stars ⭐ you want your viewers to pay (1–5⭐).</p>
              <p>💰 Each Star = ₦500 ($0.33 USD)</p>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-1">
              <p className="font-semibold">Example:</p>
              <p>1⭐ = ₦500 / $0.33</p>
              <p>2⭐ = ₦1,000 / $0.67</p>
              <p>3⭐ = ₦1,500 / $1.00</p>
              <p>4⭐ = ₦2,000 / $1.33</p>
              <p>5⭐ = ₦2,500 / $1.67</p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold">When a viewer unlocks your story:</p>
              <p>• You instantly earn 60% in your wallet 💼</p>
              <p>• The viewer receives 20% cashback as a thank-you bonus 🎁</p>
              <p>• The platform keeps 20% for smooth operation ⚙️</p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold">🌟 Tips for Uploaders:</p>
              <p>• Add attractive captions and Preview thumbnails to get more views.</p>
              <p>• Set a fair Star rate — higher Stars mean premium content.</p>
              <p>• The more views you get, the more you earn!</p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold">👀 Tips for Viewers:</p>
              <p>• Spend Stars to unlock exclusive stories.</p>
              <p>• Earn cashback instantly to your wallet.</p>
              <p>• Support creators you love and climb the leaderboard! 🏆</p>
            </div>

            <Button onClick={handleUploadClick} className="w-full" size="lg">
              <Upload className="mr-2 h-5 w-5" />
              Upload Story Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Story Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Story</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Media Upload */}
            <div>
              <Input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaChange}
                className="hidden"
                id="story-media"
              />
              <label htmlFor="story-media">
                <Button variant="outline" className="w-full" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo/Video
                  </span>
                </Button>
              </label>

              {mediaPreview && (
                <div className="mt-4">
                  {mediaFile?.type.startsWith('video/') ? (
                    <video src={mediaPreview} controls className="w-full rounded-lg max-h-60" />
                  ) : (
                    <img src={mediaPreview} alt="Preview" className="w-full rounded-lg max-h-60 object-cover" />
                  )}
                </div>
              )}
            </div>

            {/* Caption */}
            <Textarea
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />

            {/* Preview Image */}
            <div>
              <label className="text-sm font-medium">Preview Thumbnail (Optional)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPreviewFile(file);
                }}
                className="mt-1"
              />
            </div>

            {/* Music */}
            <div>
              <label className="text-sm font-medium">Add Music (Optional)</label>
              <Input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setMusicFile(file);
                }}
                className="mt-1"
              />
            </div>

            {/* Star Price Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Set Star Price (Optional)</label>
              <div className="flex gap-2">
                <Button
                  variant={starPrice === 0 ? "default" : "outline"}
                  onClick={() => setStarPrice(0)}
                  className="flex-1"
                >
                  Free
                </Button>
                {[1, 2, 3, 4, 5].map((stars) => (
                  <Button
                    key={stars}
                    variant={starPrice === stars ? "default" : "outline"}
                    onClick={() => setStarPrice(stars)}
                    className="flex-1"
                  >
                    {stars}<Star className="h-3 w-3 ml-1" />
                  </Button>
                ))}
              </div>
              {starPrice > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Viewers will pay ₦{starPrice * 500} to view. You earn ₦{starPrice * 500 * 0.6}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!mediaFile || loading}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Share Story'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
