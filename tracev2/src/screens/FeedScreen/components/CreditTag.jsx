import PropTypes from 'prop-types';
import './credits.css';


const CreditTag = ({ author }) => {
  return (
    <div className="credit-tag">
      <p className="credit-text">
        dance credits: <span className="credit-author">{author}</span>
      </p>
    </div>
  );
};

CreditTag.propTypes = {
  author: PropTypes.string.isRequired,  // Mark 'author' as a required string
};

export default CreditTag;
