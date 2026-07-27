import styled from 'styled-components';
import { device, font } from '../styles';
import { IconName } from '../utils';
import Icon from './Icons';

const EmptyState = ({
  title = '',
  description = '',
  icon = IconName.airBallon,
  image,
}: {
  title: string;
  description?: string;
  icon?: IconName;
  // Path to an illustration in /public. Takes precedence over the icon-font
  // glyph when set.
  image?: string;
}) => {
  return (
    <Container>
      {image ? <Illustration src={image} alt="" aria-hidden="true" /> : <StyledIcon name={icon} />}
      <Title>{title}</Title>
      {description && <Description>{description}</Description>}
    </Container>
  );
};
export default EmptyState;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px;

  @media ${device.mobileL} {
    padding: 48px 20px;
  }
`;

const StyledIcon = styled(Icon)`
  text-align: center;
`;

const Illustration = styled.img`
  width: 200px;
  max-width: 100%;
  height: auto;
`;

const Title = styled.div`
  ${font('2xl', 500)};
  text-align: center;
  margin: 24px 0 12px 0;
`;

const Description = styled.div`
  ${font('base', 400)};
  text-align: center;
  max-width: 420px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;
