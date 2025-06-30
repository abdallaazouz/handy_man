import { useLanguage } from '@/hooks/use-language';
import { MessageCircle, Copyright } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Copyright className="h-3 w-3" />
              <span>{t('footer.copyright')}</span>
            </div>
            <span>•</span>
            <a 
              href="https://t.me/AAPRO2025" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <MessageCircle className="h-3 w-3" />
              <span>{t('footer.support_link')}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}