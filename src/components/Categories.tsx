import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Category } from '../utils';
import Icon from './Icons';
import { IconName } from '../utils';

// Hierarchical multi-select for statyba categories. Two visible levels:
//   - level-2 chips (e.g. Gyvenamieji, Komerciniai, Tinklai…) grouped under
//     their level-1 parent (Pastatai / Inžineriniai). These are the primary
//     coarse picks.
//   - level-3 leaf chips revealed via the per-level-2 expand chevron. Power
//     users who want fine-grained filters (e.g. only "Daugiabučiai" or only
//     "Saulės elektrinės") select these directly.
//
// User can pick at any level — backend `categoryGroup` expands every selected
// id to its descendants (via categories.descendants), so picking 'Gyvenamieji'
// transparently matches its 6 leaves; picking just 'Daugiabutis' matches only
// that one leaf.
//
// Skips the 'kita' / 'nepriskirta' branch entirely — subscribing to
// "uncategorized" makes no sense as an intent.
const Categories = ({
  options,
  value,
  onChange,
}: {
  options: Category[];
  value: number[];
  onChange: (ids: number[]) => void;
}) => {
  const [expandedLevel2, setExpandedLevel2] = useState<Set<number>>(new Set());

  const groups = useMemo(() => {
    const level1 = options.filter((c) => c.parent === null && c.code !== 'kita');
    return level1.map((root) => ({
      root,
      children: options
        .filter((c) => c.parent === root.id)
        .sort((a, b) => a.sort - b.sort)
        .map((level2) => ({
          ...level2,
          leaves: options.filter((c) => c.parent === level2.id).sort((a, b) => a.sort - b.sort),
        })),
    }));
  }, [options]);

  const toggle = (id: number) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedLevel2((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Per-group "Pasirinkti visus" toggles all level-2 ids in that group.
  // Selecting level-2 ids covers their leaves via backend descendants
  // expansion, so we don't also toggle leaf ids here (would double-cover).
  const toggleGroup = (childIds: number[]) => {
    const allSelected = childIds.every((id) => value.includes(id));
    if (allSelected) {
      onChange(value.filter((v) => !childIds.includes(v)));
    } else {
      const next = new Set(value);
      childIds.forEach((id) => next.add(id));
      onChange([...next]);
    }
  };

  return (
    <Container>
      {groups.map(({ root, children }) => {
        const childIds = children.map((c) => c.id);
        const allSelected = childIds.length > 0 && childIds.every((id) => value.includes(id));
        return (
          <Group key={root.id}>
            <GroupHeaderRow>
              <GroupHeader>{root.name}</GroupHeader>
              <SelectAll onClick={() => toggleGroup(childIds)}>
                {allSelected ? 'Atžymėti visus' : 'Pasirinkti visus'}
              </SelectAll>
            </GroupHeaderRow>
            {children.map((level2) => {
              const selected = value.includes(level2.id);
              const expanded = expandedLevel2.has(level2.id);
              const selectedLeafCount = level2.leaves.filter((l) => value.includes(l.id)).length;
              return (
                <Level2Block key={level2.id}>
                  <Level2Row>
                    <Chip $selected={selected} onClick={() => toggle(level2.id)}>
                      {level2.name}
                      {!selected && selectedLeafCount > 0 && (
                        <PartialBadge>
                          {selectedLeafCount}/{level2.leaves.length}
                        </PartialBadge>
                      )}
                    </Chip>
                    {level2.leaves.length > 0 && (
                      <ExpandButton
                        type="button"
                        $expanded={expanded}
                        onClick={() => toggleExpand(level2.id)}
                        aria-label={expanded ? 'Suskleisti' : 'Išskleisti'}
                      >
                        <ChevronIcon name={IconName.dropdownArrow} />
                      </ExpandButton>
                    )}
                  </Level2Row>
                  {expanded && level2.leaves.length > 0 && (
                    <LeafRow>
                      {level2.leaves.map((leaf) => {
                        const leafSelected = value.includes(leaf.id);
                        return (
                          <LeafChip
                            key={leaf.id}
                            $selected={leafSelected}
                            onClick={() => toggle(leaf.id)}
                          >
                            {leaf.name}
                          </LeafChip>
                        );
                      })}
                    </LeafRow>
                  )}
                </Level2Block>
              );
            })}
          </Group>
        );
      })}
    </Container>
  );
};

export default Categories;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const GroupHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

const GroupHeader = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #333;
`;

const SelectAll = styled.a`
  color: #1f5c2e;
  text-decoration: underline;
  font-weight: 600;
  cursor: pointer;
  font-size: 12px;
`;

const Level2Block = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Level2Row = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
`;

const Chip = styled.div<{ $selected: boolean }>`
  padding: 8px 14px;
  border-radius: 16px;
  border: 1px solid ${({ $selected }) => ($selected ? '#1b4c28' : '#d4d5de')};
  background-color: ${({ $selected }) => ($selected ? '#f4fdf6' : 'white')};
  color: ${({ $selected }) => ($selected ? '#1b4c28' : '#525252')};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    border-color: #1b4c28;
  }
`;

const PartialBadge = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #1b4c28;
  background: #e8f5ec;
  padding: 1px 6px;
  border-radius: 8px;
`;

const ExpandButton = styled.button<{ $expanded: boolean }>`
  background: transparent;
  border: 1px solid #d4d5de;
  border-radius: 14px;
  width: 28px;
  height: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #525252;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
  transform: ${({ $expanded }) => ($expanded ? 'rotate(180deg)' : 'rotate(0deg)')};

  &:hover {
    border-color: #1b4c28;
    color: #1b4c28;
  }
`;

const ChevronIcon = styled(Icon)`
  font-size: 1.2rem;
`;

const LeafRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-left: 16px;
  margin-bottom: 4px;
`;

const LeafChip = styled.div<{ $selected: boolean }>`
  padding: 5px 10px;
  border-radius: 12px;
  border: 1px solid ${({ $selected }) => ($selected ? '#1b4c28' : '#e5e7eb')};
  background-color: ${({ $selected }) => ($selected ? '#f4fdf6' : '#fafafa')};
  color: ${({ $selected }) => ($selected ? '#1b4c28' : '#666')};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;

  &:hover {
    border-color: #1b4c28;
  }
`;
