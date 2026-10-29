import { suggestedGenres } from '@/app/constants';
import SpriteCard from '@/app/editor/components/SpriteCard';
import { EntityType } from '@/app/editor/utils/entity';
import Asset from '@/components/Asset';
import Button from '@/components/Button';
import Textarea from '@/components/Textarea';
import { LinkIcon } from '@heroicons/react/24/outline';
import { useRef, useState } from 'react';
import { useEditorProject } from '../../EditorContext';

export function SettingsList() {
  const { project, updateProject, openModal, closeModal } = useEditorProject();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const filteredGenres = suggestedGenres.filter((genre) =>
    genre.toLowerCase().includes((project.settings.genre || '').toLowerCase()),
  );

  const handleSettingChange = (key: string, value: string) => {
    updateProject(
      {
        settings: {
          ...project.settings,
          [key]: value,
        },
      },
      {
        message: 'updated setting',
        context: JSON.stringify({ [key]: value }),
      },
    );
  };

  const handleGenreInputChange = (value: string) => {
    handleSettingChange('genre', value);
    setShowSuggestions(true);
  };

  const handleGenreSelect = (genre: string) => {
    handleSettingChange('genre', genre);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleGenreInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleGenreInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 150);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 id="publishing">Publishing</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Manage how your game will appear to others.
        </p>
      </div>
      <div className="flex flex-col gap-4 rounded-lg p-4 bg-white dark:bg-slate-900">
        <div className="flex flex-col">
          <h2>Thumbnail image</h2>
          <SpriteCard
            imageSelectModalProps={{
              type: EntityType.PROJECT,
              entity: project,
              updateEntity: (updates) => {
                handleSettingChange('thumbnailImageUrl', updates.imageUrl || '');
                closeModal();
              },
            }}
            hasImage={
              !!project.settings.thumbnailImageUrl && project.settings.thumbnailImageUrl !== ''
            }
          >
            <Asset
              imageUrl={project.settings.thumbnailImageUrl}
              className="h-50"
              alt="Project thumbnail"
            />
          </SpriteCard>
        </div>
        <div className="flex flex-col">
          <h2>Short description</h2>
          <Textarea
            value={project.settings.shortDescription}
            className="bg-slate-200! dark:bg-slate-800! rounded-lg p-2 outline-none resize-none"
            onChange={(value) => handleSettingChange('shortDescription', value)}
            placeholder="What is a short pitch for this game? (e.g. 'A detective mystery game.')"
            maxLength={100}
          />
        </div>
        <div className="flex flex-col">
          <h2>Long description</h2>
          <Textarea
            value={project.settings.longDescription}
            className="bg-slate-200! dark:bg-slate-800! rounded-lg p-2 outline-none resize-none"
            onChange={(value) => handleSettingChange('longDescription', value)}
            placeholder="What is this game about? Describe the setting and goals. (e.g. 'You are a detective investigating a murder in a small town.')"
            rows={5}
          />
        </div>
        <div className="flex flex-col">
          <h2>Genre</h2>
          <div className="relative">
            <input
              ref={inputRef}
              value={project.settings.genre || ''}
              onChange={(e) => handleGenreInputChange(e.target.value)}
              onFocus={handleGenreInputFocus}
              onBlur={handleGenreInputBlur}
              className="w-full"
              placeholder="Type to search genres or enter custom"
            />
            {showSuggestions && filteredGenres.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 max-h-40 overflow-y-auto dark:bg-slate-800 dark:border-slate-700"
              >
                {filteredGenres.map((genre) => (
                  <div
                    key={genre}
                    className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                    onClick={() => handleGenreSelect(genre)}
                  >
                    {genre}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-slate-300 p-4 dark:border-slate-700">
          <div>
            <h2>초기 게임 상태</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">새 플레이를 시작할 때 상태창에 표시될 장소, 체력, 골드, 인벤토리를 설정합니다. 저장 후 새 플레이를 시작하면 적용됩니다.</p>
          </div>
          {(() => {
            const configured = project.settings.initialGameState || {};
            const startingScene = project.cartridge.scenes.find((scene) => scene.uuid === project.settings.startingSceneId);
            const startingPlace = project.cartridge.places.find((place) => place.uuid === startingScene?.placeId);
            const initialState = {
              location: configured.location || startingPlace?.name || project.cartridge.places[0]?.name || '',
              health: Number.isFinite(Number(configured.health)) ? Number(configured.health) : 100,
              maxHealth: Number.isFinite(Number(configured.maxHealth)) ? Number(configured.maxHealth) : 100,
              gold: Number.isFinite(Number(configured.gold)) ? Number(configured.gold) : 0,
              inventory: Array.isArray(configured.inventory) ? configured.inventory : [],
            };
            const saveInitialState = (updates: Partial<typeof initialState>) => {
              const next = { ...initialState, ...updates };
              next.maxHealth = Math.max(1, Math.floor(Number(next.maxHealth) || 100));
              next.health = Math.min(next.maxHealth, Math.max(0, Math.floor(Number(next.health) || 0)));
              next.gold = Math.max(0, Math.floor(Number(next.gold) || 0));
              updateProject({ settings: { ...project.settings, initialGameState: next } }, { message: 'updated initial game state', context: JSON.stringify(next) });
            };
            return <>
              <label className="flex flex-col gap-1 text-sm"><span>초기 장소</span>
                <select value={initialState.location} onChange={(event) => saveInitialState({ location: event.target.value })} className="rounded-lg bg-slate-200 p-2 text-slate-900 dark:bg-slate-800 dark:text-white">
                  {project.cartridge.places.length === 0 && <option value="">장소 없음</option>}
                  {project.cartridge.places.map((place) => <option key={place.uuid} value={place.name}>{place.name}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm"><span>최대 체력</span><input type="number" min={1} max={100000} value={initialState.maxHealth} onChange={(event) => saveInitialState({ maxHealth: Number(event.target.value) })} className="rounded-lg bg-slate-200 p-2 text-slate-900 dark:bg-slate-800 dark:text-white" /></label>
                <label className="flex flex-col gap-1 text-sm"><span>초기 체력</span><input type="number" min={0} max={initialState.maxHealth} value={initialState.health} onChange={(event) => saveInitialState({ health: Number(event.target.value) })} className="rounded-lg bg-slate-200 p-2 text-slate-900 dark:bg-slate-800 dark:text-white" /></label>
                <label className="col-span-2 flex flex-col gap-1 text-sm"><span>초기 골드</span><input type="number" min={0} max={1000000000} value={initialState.gold} onChange={(event) => saveInitialState({ gold: Number(event.target.value) })} className="rounded-lg bg-slate-200 p-2 text-slate-900 dark:bg-slate-800 dark:text-white" /></label>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">초기 인벤토리</h3><Button onClick={() => saveInitialState({ inventory: [...initialState.inventory, { id: `item-${Date.now()}`, name: '새 아이템', quantity: 1 }] })}>아이템 추가</Button></div>
                {initialState.inventory.length === 0 && <p className="text-sm text-slate-500">초기 아이템이 없습니다.</p>}
                {initialState.inventory.map((item, index) => <div key={item.id || index} className="grid grid-cols-[minmax(0,1fr)_5rem_auto] items-center gap-2">
                  <input aria-label="아이템 이름" value={item.name} onChange={(event) => saveInitialState({ inventory: initialState.inventory.map((current, i) => i === index ? { ...current, name: event.target.value } : current) })} className="min-w-0 rounded-lg bg-slate-200 p-2 text-slate-900 dark:bg-slate-800 dark:text-white" />
                  <input aria-label="아이템 수량" type="number" min={1} max={100000} value={item.quantity} onChange={(event) => saveInitialState({ inventory: initialState.inventory.map((current, i) => i === index ? { ...current, quantity: Math.max(1, Math.floor(Number(event.target.value) || 1)) } : current) })} className="w-full rounded-lg bg-slate-200 p-2 text-slate-900 dark:bg-slate-800 dark:text-white" />
                  <Button variant="icon" onClick={() => saveInitialState({ inventory: initialState.inventory.filter((_, i) => i !== index) })} aria-label="아이템 삭제">×</Button>
                </div>)}
              </div>
            </>;
          })()}
        </div>
        <div className="flex flex-col">
          <h2>Allow others to remix your game</h2>
          <select
            value={project.settings.remixable ? 'true' : 'false'}
            onChange={(e) => handleSettingChange('remixable', e.target.value)}
            className="bg-slate-200! dark:bg-slate-800! rounded-lg p-2 outline-none cursor-pointer"
          >
            <option value="true">Yes — Others can duplicate and remix your game</option>
            <option value="false">No — Only you can edit or copy this game</option>
          </select>
        </div>
        <div className="flex flex-col">
          <h2>Who can play your game?</h2>
          <select
            value={project.settings.visibility}
            onChange={(e) => handleSettingChange('visibility', e.target.value)}
            className="bg-slate-200! dark:bg-slate-800! rounded-lg p-2 outline-none cursor-pointer"
          >
            <option value="public">Published — Anyone can find and play your game</option>
            <option value="unlisted">
              Unlisted — Only people with the link can play your game
            </option>
            <option value="private">Draft — Only you can play your game</option>
          </select>
        </div>
        <div className="flex flex-col">
          <Button
            onClick={() => openModal('sharing')}
            className="w-full flex items-center gap-2 justify-center"
          >
            Share your game link <LinkIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
