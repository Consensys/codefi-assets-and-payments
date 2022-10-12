import React, {
  FunctionComponent,
  useState,
  useEffect,
  useCallback,
} from 'react';
import Loader from 'uiComponents/Loader';
import { constructCofidocsFileUrl } from 'utils/commonUtils';

interface IProps {
  readonly docId: string;
  readonly alt: string;
  readonly style?: React.CSSProperties;
}

const ServerImage: FunctionComponent<IProps> = ({
  docId,
  alt,
  style,
}: IProps) => {
  const [image, setImage] = useState<string>();
  const fetchImage = useCallback(async () => {
    if (docId) {
      const url = await constructCofidocsFileUrl(docId);
      setImage(url);
    }
  }, [docId]);
  useEffect(() => {
    fetchImage();
  }, [fetchImage]);

  if (!docId) {
    return null;
  }

  if (!image) {
    return <Loader />;
  }

  return <img style={style} src={image} alt={alt} />;
};

export default React.memo(ServerImage);
