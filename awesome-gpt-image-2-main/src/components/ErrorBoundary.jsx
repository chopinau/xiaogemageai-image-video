import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '40px',
          textAlign: 'center',
          color: '#aebcd0'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            color: '#ff6b8a'
          }}>⚠</div>
          <h2 style={{ color: '#eef5ff', marginBottom: '8px' }}>页面出现错误</h2>
          <p style={{ maxWidth: '500px', lineHeight: '1.6', marginBottom: '24px' }}>
            {this.state.error?.message || '发生了未知错误，请刷新页面重试'}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 24px',
                border: 'none',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #42e6ff, #78ffb9)',
                color: '#06101a',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              重试
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)',
                color: '#aebcd0',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
