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
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2>사용자 정의 상태 항목</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">장소와 인벤토리는 고정 표시됩니다. 체력·골드 대신 게임에 필요한 상태 항목을 직접 정의할 수 있습니다.</p>
            </div>
            <Button onClick={() => {
              const fields = project.settings.customStatusFields ?? [];
              const field = { key: `status_${Date.now()}`, label: '새 상태', type: 'number' as const, initialValue: 0, visible: true };
              updateProject({ settings: { ...project.settings, customStatusFields: [...fields, field] } }, { message: 'added custom status field', context: JSON.stringify(field) });
            }}>항목 추가</Button>
          </div>
          {(project.settings.customStatusFields ?? []).map((field, index) => {
            const fields = project.settings.customStatusFields ?? [];
            const saveField = (updates: Partial<typeof field>) => {
              const next = fields.map((item, i) => i === index ? { ...item, ...updates } : item);
              updateProject({ settings: { ...project.settings, customStatusFields: next } }, { message: 'updated custom status fields', context: JSON.stringify(next) });
            };
            return <div key={`${field.key}-${index}`} className="grid grid-cols-1 gap-2 rounded-lg bg-slate-100 p-3 dark:bg-slate-800 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm"><span>표시 이름</span><input value={field.label} maxLength={40} onChange={(event) => saveField({ label: event.target.value })} className="rounded-lg bg-white p-2 text-slate-900 dark:bg-slate-700 dark:text-white" /></label>
              <label className="flex flex-col gap-1 text-sm"><span>키 (영문/숫자/_/-)</span><input value={field.key} maxLength={40} onChange={(event) => saveField({ key: event.target.value.replace(/[^a-zA-Z0-9_-]/g, '') })} className="rounded-lg bg-white p-2 text-slate-900 dark:bg-slate-700 dark:text-white" /></label>
              <label className="flex flex-col gap-1 text-sm"><span>유형</span><select value={field.type} onChange={(event) => { const type = event.target.value as 'number' | 'text' | 'boolean'; saveField({ type, initialValue: type === 'number' ? 0 : type === 'boolean' ? false : '', min: undefined, max: undefined }); }} className="rounded-lg bg-white p-2 text-slate-900 dark:bg-slate-700 dark:text-white"><option value="number">숫자</option><option value="text">텍스트</option><option value="boolean">참/거짓</option></select></label>
              <label className="flex flex-col gap-1 text-sm"><span>초기값</span>{field.type === 'number' ? <input type="number" value={Number(field.initialValue)} onChange={(event) => saveField({ initialValue: Number(event.target.value) })} className="rounded-lg bg-white p-2 text-slate-900 dark:bg-slate-700 dark:text-white" /> : field.type === 'boolean' ? <select value={String(field.initialValue)} onChange={(event) => saveField({ initialValue: event.target.value === 'true' })} className="rounded-lg bg-white p-2 text-slate-900 dark:bg-slate-700 dark:text-white"><option value="false">아니오</option><option value="true">예</option></select> : <input value={String(field.initialValue)} maxLength={500} onChange={(event) => saveField({ initialValue: event.target.value })} className="rounded-lg bg-white p-2 text-slate-900 dark:bg-slate-700 dark:text-white" />}</label>
              {field.type === 'number' && <div className="grid grid-cols-2 gap-2 sm:col-span-2"><label className="flex flex-col gap-1 text-sm"><span>최소값 (선택)</span><input type="number" value={field.min ?? ''} onChange={(event) => saveField({ min: event.target.value === '' ? undefined : Number(event.target.value) })} className="rounded-lg bg-white p-2 text-slate-900 dark:bg-slate-700 dark:text-white" /></label><label className="flex flex-col gap-1 text-sm"><span>최대값 (선택)</span><input type="number" value={field.max ?? ''} onChange={(event) => saveField({ max: event.target.value === '' ? undefined : Number(event.target.value) })} className="rounded-lg bg-white p-2 text-slate-900 dark:bg-slate-700 dark:text-white" /></label></div>}
              <div className="flex items-center justify-between sm:col-span-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={field.visible !== false} onChange={(event) => saveField({ visible: event.target.checked })} />상태창에 표시</label><Button variant="icon" aria-label="상태 항목 삭제" onClick={() => { const next = fields.filter((_, i) => i !== index); updateProject({ settings: { ...project.settings, customStatusFields: next } }, { message: 'removed custom status field', context: JSON.stringify(next) }); }}>×</Button></div>
            </div>;
          })}
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-slate-300 p-4 dark:border-slate-700">
          <div>
            <h2>초기 게임 상태</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">새 플레이의 시작 장소와 인벤토리를 설정합니다. 체력·골드 등 추가 상태값은 위에서 사용자 정의 항목으로 설정하세요.</p>
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
