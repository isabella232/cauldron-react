import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import AriaIsolate from 'src/lib/utils/aria-isolate';
import { typeMap, tabIndexHandler } from './utils';

/**
 * The cauldron toast notification component
 */
export default class Toast extends Component {
  static propTypes = {
    // the ui to be added as the message of the toast
    children: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object,
      PropTypes.array
    ]).isRequired,
    // "confirmation", "caution", or "action-needed"
    type: PropTypes.string.isRequired,
    // function to be exectued when toast is dismissed
    onDismiss: PropTypes.func,
    // if provided, should be a number in ms
    autoHide: PropTypes.number,
    // text to be added as the aria-label of the "x" dismiss button (default: "Dismiss")
    dismissText: PropTypes.string,
    // an optional ref function to get a handle on the toast element
    toastRef: PropTypes.func,
    // whether or not to show the toast
    show: PropTypes.bool
  };

  static defaultProps = {
    dismissText: 'Dismiss',
    onDismiss: () => {},
    toastRef: () => {},
    show: false
  };

  constructor(props) {
    super(props);

    this.state = {
      animationClass: props.show ? 'dqpl-fadein-setup' : 'dqpl-hidden',
      destroy: !props.show
    };

    this.dismissToast = this.dismissToast.bind(this);
    this.showToast = this.showToast.bind(this);
  }

  componentDidMount() {
    const { destroy } = this.state;
    const { autoHide } = this.props;

    if (!destroy) {
      // Timeout because CSS display: none/block and opacity:
      // 0/1 properties cannot be toggled in the same tick
      // see: https://codepen.io/isnerms/pen/eyQaLP
      setTimeout(this.showToast);
      if (autoHide) {
        setTimeout(this.dismissToast, autoHide);
      }
    }
  }

  // TODO: getting rid of the destroy state all together would simplify this
  // (if props.show changes => do the show/hide stuff)
  UNSAFE_componentWillReceiveProps(nextProps) {
    const { destroy } = this.state;

    if (destroy && nextProps.show) {
      // update from hidden to show
      this.setState({ animationClass: 'dqpl-fadein-setup' }, () => {
        // Timeout because CSS display: none/block and opacity:
        // 0/1 properties cannot be toggled in the same tick
        // see: https://codepen.io/isnerms/pen/eyQaLP
        setTimeout(this.showToast);
      });
    } else if (!destroy && !nextProps.show) {
      this.dismissToast();
    }
  }

  render() {
    const { animationClass, destroy } = this.state;
    const { type, children, dismissText, toastRef } = this.props;
    const scrim =
      type === 'action-needed' && !destroy ? (
        <div className="dqpl-scrim-light dqpl-scrim-show dqpl-scrim-fade-in" />
      ) : null;

    return (
      <Fragment>
        <div
          tabIndex={-1}
          className={`dqpl-toast dqpl-toast-${
            typeMap[type].className
          } ${animationClass}`}
          ref={el => {
            toastRef(el);
            this.el = el;
          }}
        >
          <div className="dqpl-toast-message">
            <div className={`fa ${typeMap[type].icon}`} aria-hidden="true" />
            <span>{children}</span>
          </div>
          {type !== 'action-needed' && (
            <button
              type="button"
              className={'dqpl-toast-dismiss fa fa-close'}
              aria-label={dismissText}
              onClick={this.dismissToast}
            />
          )}
        </div>
        {scrim}
      </Fragment>
    );
  }

  dismissToast() {
    if (!this.el) {
      return;
    }
    const { onDismiss, type } = this.props;
    const { isolator } = this.state;

    this.setState(
      {
        animationClass: 'dqpl-fadein-setup'
      },
      () => {
        // Timeout because CSS display: none/block and opacity:
        // 0/1 properties cannot be toggled in the same tick
        // see: https://codepen.io/isnerms/pen/eyQaLP
        setTimeout(() => {
          if (type === 'action-needed') {
            tabIndexHandler(true, this.el);
            isolator.deactivate();
          }

          this.setState(
            { destroy: true, animationClass: 'dqpl-hidden' },
            onDismiss
          );
        });
      }
    );
  }

  showToast() {
    const { type } = this.props;

    this.setState(
      {
        destroy: false,
        animationClass: 'dqpl-fadein-setup dqpl-fadein'
      },
      () => {
        if (type === 'action-needed') {
          const isolator = new AriaIsolate(this.el);
          tabIndexHandler(false, this.el);
          this.setState({ isolator });
          isolator.activate();
        }

        if (this.el) {
          // focus the toast
          this.el.focus();
        }
      }
    );
  }
}
