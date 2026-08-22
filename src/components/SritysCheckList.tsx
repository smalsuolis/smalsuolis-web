import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { device, font } from '../styles';
import { App, Category, IconName } from '../utils';
import { isInfostatyba, NodeState, useCategoryLeafIds } from '../utils/sritys';
import CategoryTree from './home/CategoryTree';
import Icon from './Icons';

// Shared "sritys" checkbox list: one row per app with a thin divider, and the
// infostatyba rows expanding inline into the category tree.
//
// Extracted from SritysFilterModal so the homepage/map filter and the
// subscription form share one control. The tri-state parent logic lives here:
// an infostatyba app's checkbox derives none/partial/all from its selected
// category leaves and cascades down when toggled; other apps are plain on/off.

interface Props {
  apps: App[];
  categories: Category[];
  // Selected non-infostatyba app ids.
  appIds: number[];
  onAppIdsChange: (ids: number[]) => void;
  // Selected category leaf ids for a given infostatyba app.
  catsFor: (appId: number) => number[];
  onCatsChange: (appId: number, ids: number[]) => void;
}

const SritysCheckList = ({
  apps,
  categories,
  appIds,
  onAppIdsChange,
  catsFor,
  onCatsChange,
}: Props) => {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const categoryLeafIds = useCategoryLeafIds(categories);

  const toggleExpand = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // The list comes back from the API in no particular order, which reshuffled
  // the rows between openings; id order also keeps the four infostatyba rows
  // together.
  const ordered = useMemo(() => [...apps].sort((a, b) => a.id - b.id), [apps]);

  const hasCategories = (app: App) => isInfostatyba(app) && categories.length > 0;

  // An expandable row reads from its own categories when it has any — so a leaf
  // ticked inside it shows as "partial" on the parent — and from the app
  // selection otherwise.
  const appState = (app: App): NodeState => {
    if (hasCategories(app)) {
      const selected = catsFor(app.id).length;
      if (selected > 0) return selected >= categoryLeafIds.length ? 'all' : 'partial';
    }
    return appIds.includes(app.id) ? 'all' : 'none';
  };

  const toggleAppNode = (app: App) => {
    const on = appIds.includes(app.id);
    onAppIdsChange(on ? appIds.filter((v) => v !== app.id) : [...appIds, app.id]);
    // Selecting an expandable row takes every leaf under it; clearing drops them.
    if (hasCategories(app)) onCatsChange(app.id, on ? [] : [...categoryLeafIds]);
  };

  return (
    <List>
      {ordered.map((app) => {
        const hasChildren = hasCategories(app);
        const state = appState(app);
        const isOpen = expanded.has(app.id);

        return (
          <div key={app.id}>
            <Row>
              <Checkbox
                $state={state}
                onClick={() => toggleAppNode(app)}
                role="checkbox"
                aria-checked={state === 'partial' ? 'mixed' : state === 'all'}
                aria-label={app.name}
              >
                {state === 'all' && <Check />}
                {state === 'partial' && <Dash />}
              </Checkbox>
              <Name onClick={() => toggleAppNode(app)}>{app.name}</Name>
              {/* Anything with subitems is expandable, regardless of selection. */}
              {hasChildren && (
                <ExpandBtn
                  type="button"
                  onClick={() => toggleExpand(app.id)}
                  aria-label="Išskleisti"
                >
                  <Chevron name={IconName.dropdownArrow} $open={isOpen} />
                </ExpandBtn>
              )}
            </Row>
            {hasChildren && isOpen && (
              <TreeWrap>
                <CategoryTree
                  options={categories}
                  value={catsFor(app.id)}
                  onChange={(ids) => onCatsChange(app.id, ids)}
                />
              </TreeWrap>
            )}
          </div>
        );
      })}
    </List>
  );
};

export default SritysCheckList;

const List = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.grey[300]};
`;

// Design: a 16px box with a 4px radius — white with a #D9D9D9 ring when empty,
// filled #1FC84C once chosen. The glyph inside is white, not black.
const Checkbox = styled.span<{ $state: NodeState }>`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid ${({ $state }) => ($state === 'none' ? '#d9d9d9' : '#1fc84c')};
  background: ${({ $state, theme }) => ($state === 'none' ? theme.colors.white : '#1fc84c')};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
`;

const Dash = styled.span`
  width: 8px;
  height: 2px;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.white};
`;

// CSS-drawn checkmark with a 2px stroke to match the Dash weight (the icon-font
// check rendered too heavy next to the thin dash).
const Check = styled.span`
  width: 4px;
  height: 8px;
  margin-top: -2px;
  border: solid ${({ theme }) => theme.colors.white};
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
`;

const Name = styled.span`
  ${font('sm', 500)};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  flex: 1;
`;

const ExpandBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
  background: transparent;
  border: none;
  flex-shrink: 0;
`;

const Chevron = styled(Icon)<{ $open: boolean }>`
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.grey[600]};
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.15s ease;
`;

const TreeWrap = styled.div`
  padding: 4px 0 8px 34px;

  @media ${device.mobileL} {
    padding-left: 16px;
  }
`;
