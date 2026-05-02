import { useMemo } from 'react';
import styled from 'styled-components';
import { Category } from '../utils';

// Multi-select for subscription categories. We expose level-2 nodes
// (e.g. Gyvenamieji, Komerciniai, Tinklai…) grouped under their level-1
// parents (Pastatai, Inžineriniai). Level-3 leaves are too granular for a
// subscription filter — server expands the selected ids to descendants
// (see categories.descendants), so picking 'Gyvenamieji' transparently
// matches all leaves under it.
const Categories = ({
  options,
  value,
  onChange,
}: {
  options: Category[];
  value: number[];
  onChange: (ids: number[]) => void;
}) => {
  const groups = useMemo(() => {
    // Skip the 'kita' / 'nepriskirta' branch — picking "give me only
    // unclassified" makes no sense as a subscription filter.
    const level1 = options.filter((c) => c.parent === null && c.code !== 'kita');
    return level1.map((root) => ({
      root,
      children: options.filter((c) => c.parent === root.id).sort((a, b) => a.sort - b.sort),
    }));
  }, [options]);

  const toggle = (id: number) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

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
            <ChipRow>
              {children.map((child) => {
                const selected = value.includes(child.id);
                return (
                  <Chip key={child.id} $selected={selected} onClick={() => toggle(child.id)}>
                    {child.name}
                  </Chip>
                );
              })}
            </ChipRow>
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

const ChipRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
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

  &:hover {
    border-color: #1b4c28;
  }
`;
