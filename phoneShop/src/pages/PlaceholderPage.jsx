import TopNav from '../components/layout/TopNav';
import Icon from '../components/ui/Icon';

export default function PlaceholderPage({ title, icon, description }) {
  return (
    <>
      <TopNav title={title} />
      <main className="flex-1 flex flex-col items-center justify-center p-margin-desktop text-center">
        <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-primary mb-lg">
          <Icon name={icon} className="text-3xl" />
        </div>
        <h2 className="font-headline-md text-headline-md text-on-surface mb-sm">{title}</h2>
        <p className="font-body-md text-body-md text-secondary max-w-md">{description}</p>
      </main>
    </>
  );
}
